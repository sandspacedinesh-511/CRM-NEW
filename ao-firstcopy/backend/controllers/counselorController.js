const {
  User,
  Student,
  Document,
  University,
  StudentUniversityApplication,
  Note,
  Activity,
  Task,
  TelecallerImportedTask,
  Notification,
  ApplicationCountry
} = require('../models');
const { Sequelize, Op } = require('sequelize');
const { createObjectCsvStringifier } = require('csv-writer');
const path = require('path');
const fs = require('fs');
const { cacheUtils } = require('../config/redis');
const websocketService = require('../services/websocketService');
const { performanceLogger, realTimeLogger } = require('../utils/logger');
const emailService = require('../services/emailService');

// Check if email is available for new student
exports.checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        message: 'Email parameter is required' 
      });
    }

    // Check cache first
    const cacheKey = `email_check:${email.toLowerCase()}`;
    const cachedResult = await cacheUtils.get(cacheKey);
    
    if (cachedResult !== null) {
      performanceLogger.logCacheOperation('get', cacheKey, true);
      return res.json(cachedResult);
    }

    // Check if email already exists in Students table
    const existingStudent = await Student.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingStudent) {
      const result = { 
        available: false, 
        message: 'A student with this email already exists' 
      };
      
      // Cache result for 5 minutes
      await cacheUtils.set(cacheKey, result, 300);
      performanceLogger.logCacheOperation('set', cacheKey, false);
      
      return res.json(result);
    }

    // Also check if email exists in Users table (for counselors/admins)
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      const result = { 
        available: false, 
        message: 'This email is already registered as a user account' 
      };
      
      // Cache result for 5 minutes
      await cacheUtils.set(cacheKey, result, 300);
      performanceLogger.logCacheOperation('set', cacheKey, false);
      
      return res.json(result);
    }

    const result = { 
      available: true, 
      message: 'Email is available' 
    };
    
    // Cache result for 5 minutes
    await cacheUtils.set(cacheKey, result, 300);
    performanceLogger.logCacheOperation('set', cacheKey, false);

    return res.json(result);

  } catch (error) {
    console.error('Error checking email availability:', error);
    res.status(500).json({ 
      message: 'Error checking email availability' 
    });
  }
};

// Get counselor dashboard statistics and data
exports.getDashboardStats = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const cacheKey = `dashboard:${counselorId}`;
    
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      performanceLogger.logCacheOperation('get', cacheKey, true);
      return res.json(cachedData);
    }

    const timer = performanceLogger.startTimer('dashboard_stats');

    // Get total students
    const totalStudents = await Student.count({
      where: { counselorId }
    });

    // Get active applications (students past document collection phase)
    const activeApplications = await StudentUniversityApplication.count({
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId }
      }],
      where: {
        applicationStatus: {
          [Op.notIn]: ['REJECTED', 'DEFERRED']
        }
      }
    });

    // Get pending documents count
    const pendingDocuments = await Document.count({
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId },
        attributes: []
      }],
      where: {
        status: 'PENDING'
      }
    }) || 0;

    // Get upcoming deadlines (applications due in next 30 days)
    const upcomingDeadlines = await StudentUniversityApplication.count({
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId }
      }],
      where: {
        applicationDeadline: {
          [Op.between]: [new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
        }
      }
    }) || 0;

    // Get recent students
    const recentStudents = await Student.findAll({
      where: { counselorId },
      order: [['updatedAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'firstName', 'lastName', 'currentPhase', 'status', 'updatedAt']
    });

    // Get upcoming tasks
    let tasks = [];
    try {
      const [pendingDocuments, upcomingApplications] = await Promise.all([
        // Pending documents
        Document.findAll({
          include: [{
            model: Student,
            as: 'student',
            where: { counselorId },
            attributes: ['firstName', 'lastName']
          }],
          where: {
            status: 'PENDING'
          },
          order: [['createdAt', 'DESC']],
          limit: 5
        }),
        // Application deadlines
        StudentUniversityApplication.findAll({
          include: [
            {
              model: Student,
              as: 'student',
              where: { counselorId },
              attributes: ['firstName', 'lastName']
            },
            {
              model: University,
              as: 'university',
              attributes: ['name']
            }
          ],
          where: {
            applicationDeadline: {
              [Op.not]: null,
              [Op.gte]: new Date()
            }
          },
          order: [['applicationDeadline', 'ASC']],
          limit: 5
        })
      ]);

      // Format tasks
      tasks = [
        ...pendingDocuments.map(doc => ({
          id: `doc-${doc.id}`,
          type: 'Document',
          description: `Upload ${doc.type} for ${doc.student.firstName} ${doc.student.lastName}`,
          deadline: doc.createdAt
        })),
        ...upcomingApplications.map(app => ({
          id: `app-${app.id}`,
          type: 'Application',
          description: `Application deadline for ${app.student.firstName} ${app.student.lastName} - ${app.university.name}`,
          deadline: app.applicationDeadline
        }))
      ].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
       .slice(0, 5);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      tasks = [];
    }

    // Get phase distribution
    let phaseDistribution = [];
    try {
      const phases = await Student.findAll({
        where: { counselorId },
        attributes: [
          'currentPhase',
          [Sequelize.fn('COUNT', Sequelize.col('Student.id')), 'count']
        ],
        group: ['currentPhase']
      });

      phaseDistribution = phases.map(phase => ({
        phase: phase.currentPhase,
        count: parseInt(phase.getDataValue('count'))
      }));
    } catch (error) {
      console.error('Error fetching phase distribution:', error);
    }

    // Get university distribution
    let universityDistribution = [];
    try {
      const universities = await StudentUniversityApplication.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('StudentUniversityApplication.id')), 'count']
        ],
        include: [
          {
            model: Student,
            as: 'student',
            where: { counselorId },
            attributes: []
          },
          {
            model: University,
            as: 'university',
            attributes: ['name']
          }
        ],
        group: ['university.id', 'university.name'],
        having: Sequelize.literal('COUNT(StudentUniversityApplication.id) > 0'),
        order: [[Sequelize.literal('COUNT(StudentUniversityApplication.id)'), 'DESC']],
        limit: 5
      });

      universityDistribution = universities.map(app => ({
        name: app.university.name,
        count: parseInt(app.getDataValue('count'))
      }));
    } catch (error) {
      console.error('Error fetching university distribution:', error);
    }

    const dashboardData = {
      stats: {
        totalStudents: totalStudents || 0,
        activeApplications: activeApplications || 0,
        pendingDocuments,
        upcomingDeadlines
      },
      recentStudents: recentStudents || [],
      upcomingTasks: tasks,
      phaseDistribution: phaseDistribution || [],
      universityDistribution: universityDistribution || []
    };

    // Cache the result for 5 minutes
    await cacheUtils.set(cacheKey, dashboardData, 300);
    performanceLogger.logCacheOperation('set', cacheKey, false);

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/counselor/dashboard', duration, 200, counselorId);

    // Add cache control headers to prevent browser caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching counsellor dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Counselor: accept a lead assignment (set counselorId on student)
exports.acceptLeadAssignment = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { id } = req.params; // student/lead id

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Lead (student) not found'
      });
    }

    const previousCounselorId = student.counselorId;

    // Assign this lead to the current counselor
    await student.update({ counselorId });

    // Clear dashboard cache for both previous and new counselor so stats update quickly
    try {
      const newCacheKey = `dashboard:${counselorId}`;
      await cacheUtils.del(newCacheKey);

      if (previousCounselorId && previousCounselorId !== counselorId) {
        const previousCacheKey = `dashboard:${previousCounselorId}`;
        await cacheUtils.del(previousCacheKey);
      }
    } catch (cacheError) {
      console.error('Error clearing dashboard cache after lead acceptance:', cacheError);
      // Do not fail main request on cache issues
    }

    // If this lead originated from telecaller imported tasks, mark those records as assigned
    try {
      const where = {};
      const orConditions = [];
      if (student.email) {
        orConditions.push({ emailId: student.email });
      }
      if (student.phone) {
        orConditions.push({ contactNumber: student.phone });
      }
      if (orConditions.length) {
        where[Op.or] = orConditions;
        await TelecallerImportedTask.update(
          { leadStatus: 'ASSIGNED_TO_COUNSELOR' },
          { where }
        );
      }
    } catch (importedUpdateError) {
      console.error('Error updating telecaller imported tasks on lead acceptance:', importedUpdateError);
      // Do not fail the main request if this background update fails
    }

    return res.json({
      success: true,
      message: 'Lead assignment accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting lead assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept lead assignment'
    });
  }
};

// Counselor: get list of other active counselors to share leads with
exports.getAvailableCounselors = async (req, res) => {
  try {
    const currentCounselorId = req.user.id;

    const counselors = await User.findAll({
      where: {
        role: 'counselor',
        active: true,
        id: {
          [Op.ne]: currentCounselorId
        }
      },
      attributes: ['id', 'name', 'email', 'phone', 'specialization']
    });

    return res.json({
      success: true,
      message: 'Counselors fetched successfully',
      data: counselors
    });
  } catch (error) {
    console.error('Error fetching available counselors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load counselors list'
    });
  }
};

// Counselor: share a lead (student) with another counselor via notification
exports.shareLeadWithCounselor = async (req, res) => {
  try {
    const sourceCounselorId = req.user.id;
    const sourceCounselorName = req.user.name || 'Counselor';
    const { id } = req.params; // student/lead id
    const { counselorId: targetCounselorId } = req.body || {};

    if (!targetCounselorId) {
      return res.status(400).json({
        success: false,
        message: 'Target counselorId is required'
      });
    }

    if (Number(targetCounselorId) === Number(sourceCounselorId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot share a lead with yourself'
      });
    }

    // Ensure target counselor exists and is active
    const targetCounselor = await User.findOne({
      where: {
        id: targetCounselorId,
        role: 'counselor',
        active: true
      },
      attributes: ['id', 'name', 'email']
    });

    if (!targetCounselor) {
      return res.status(404).json({
        success: false,
        message: 'Target counselor not found or inactive'
      });
    }

    // Ensure the student belongs to the current counselor
    const student = await Student.findOne({
      where: {
        id,
        counselorId: sourceCounselorId
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'counselorId']
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Lead (student) not found for this counselor'
      });
    }

    // Do NOT unassign here. The lead should remain visible to the current
    // counselor until the receiving counselor accepts the share request.
    const now = new Date();
    const notification = {
      id: Date.now(),
      type: 'lead_assignment',
      title: 'Lead Shared With You',
      message: `${sourceCounselorName} shared a lead: ${student.firstName} ${student.lastName}`,
      timestamp: now.toISOString(),
      isRead: false,
      priority: 'high',
      leadId: student.id,
      sharedByCounselorId: sourceCounselorId
    };

    try {
      const key = `notifications:${targetCounselor.id}`;
      const existing = (await cacheUtils.get(key)) || [];
      existing.unshift(notification);
      await cacheUtils.set(key, existing, 3600);

      await websocketService.sendNotification(targetCounselor.id, notification);
    } catch (notifyError) {
      console.error('Failed to push counselor lead share notification:', notifyError);
      // Continue even if real-time notification fails; the API still succeeded
    }

    return res.json({
      success: true,
      message: `Lead share request sent to counselor ${targetCounselor.name} successfully`,
      data: {
        studentId: student.id,
        targetCounselorId: targetCounselor.id
      }
    });
  } catch (error) {
    console.error('Error sharing lead with counselor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share lead with counselor'
    });
  }
};

// Get students with filtering and pagination
exports.getStudents = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { search, phase, sort, page = 1, limit = 10 } = req.query;

    // Build cache key based on query parameters
    const cacheKey = `students:${counselorId}:${search || 'all'}:${phase || 'all'}:${sort || 'default'}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      performanceLogger.logCacheOperation('get', cacheKey, true);
      return res.json(cachedData);
    }

    const timer = performanceLogger.startTimer('get_students');

    // Build where clause
    const where = { counselorId };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    if (phase && phase !== 'ALL') {
      where.currentPhase = phase;
    }

    // Build order clause
    let order = [['createdAt', 'DESC']];
    switch (sort) {
      case 'name_asc':
        order = [['firstName', 'ASC'], ['lastName', 'ASC']];
        break;
      case 'name_desc':
        order = [['firstName', 'DESC'], ['lastName', 'DESC']];
        break;
      case 'date_asc':
        order = [['createdAt', 'ASC']];
        break;
      // default is date_desc
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Student.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'type', 'status'],
          required: false
        },
        {
          model: StudentUniversityApplication,
          as: 'applications',
          attributes: ['id', 'applicationStatus', 'universityId'],
          include: [
            {
              model: University,
              as: 'university',
              attributes: ['name', 'country']
            }
          ],
          required: false
        }
      ]
    });

    const result = {
      success: true,
      message: 'Students fetched successfully',
      data: {
        students: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    };

    // Cache the result for 1 minute
    await cacheUtils.set(cacheKey, result, 60);
    performanceLogger.logCacheOperation('set', cacheKey, false);

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/counselor/students', duration, 200, counselorId);

    res.json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      message: 'Error fetching students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to auto-create country profiles from targetCountries
async function autoCreateCountryProfilesFromTargetCountries(studentId, targetCountries) {
  if (!targetCountries) return;

  // Parse comma-separated countries
  const countries = targetCountries
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  if (countries.length === 0) return;

  // Create country profiles for each country
  for (const country of countries) {
    try {
      // Check if profile already exists
      const existing = await ApplicationCountry.findOne({
        where: { studentId, country }
      });

      if (!existing) {
        await ApplicationCountry.create({
          studentId,
          country,
          currentPhase: 'DOCUMENT_COLLECTION',
          totalApplications: 0,
          primaryApplications: 0,
          backupApplications: 0,
          acceptedApplications: 0,
          rejectedApplications: 0,
          pendingApplications: 0,
          totalApplicationFees: 0,
          totalScholarshipAmount: 0,
          visaRequired: true,
          visaStatus: 'NOT_STARTED',
          preferredCountry: false,
          notes: `Country profile auto-created from target countries: ${country}. Application progress starts from beginning.`
        });
      }
    } catch (error) {
      // Log but don't fail - country profile creation is not critical
      console.error(`Error creating country profile for ${country}:`, error.message);
    }
  }
}

// Add new student
exports.addStudent = async (req, res) => {
  try {
    // Validate required fields
    const { firstName, lastName, email } = req.body;
    
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        message: 'First name, last name, and email are required' 
      });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({
      where: { email }
    });

    if (existingStudent) {
      return res.status(409).json({ 
        message: 'A student with this email already exists' 
      });
    }

    const student = await Student.create({
      ...req.body,
      counselorId: req.user.id
    });

    // Auto-create country profiles from targetCountries
    if (req.body.targetCountries) {
      await autoCreateCountryProfilesFromTargetCountries(student.id, req.body.targetCountries);
    }
    
    // Clear dashboard cache to ensure stats update
    const cacheKey = `dashboard:${req.user.id}`;
    await cacheUtils.del(cacheKey);
    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: student
    });
  } catch (error) {
    console.error('Error adding student:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'A student with this email already exists' 
      });
    }
    
    res.status(500).json({ message: 'Error adding student. Please try again.' });
  }
};

// Get student details
exports.getStudentDetails = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      },
      include: [
        {
          model: Document,
          as: 'documents'
        },
        {
          model: StudentUniversityApplication,
          as: 'applications',
          include: [{
            model: University,
            as: 'university'
          }]
        },
        {
          model: User,
          as: 'marketingOwner',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        },
        {
          model: ApplicationCountry,
          as: 'countryProfiles',
          required: false
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Auto-create country profiles from targetCountries if they don't exist
    if (student.targetCountries) {
      await autoCreateCountryProfilesFromTargetCountries(student.id, student.targetCountries);
      // Reload student to get the newly created country profiles
      await student.reload({
        include: [{
          model: ApplicationCountry,
          as: 'countryProfiles',
          required: false
        }]
      });
    }

    res.json({
      success: true,
      message: 'Student details fetched successfully',
      data: student
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Error fetching student details' });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if phase is being changed and validate document requirements
    if (req.body.currentPhase && req.body.currentPhase !== student.currentPhase) {
      const currentPhase = student.currentPhase;
      const newPhase = req.body.currentPhase;
      
      // Define required documents for each phase (logical progression)
      const phaseRequirements = {
        'DOCUMENT_COLLECTION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME'],
        'UNIVERSITY_SHORTLISTING': ['PASSPORT', 'ACADEMIC_TRANSCRIPT'],
        'APPLICATION_SUBMISSION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE'],
        'OFFER_RECEIVED': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE'],
        'INITIAL_PAYMENT': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
        'INTERVIEW': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
        'FINANCIAL_TB_TEST': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'CAS_VISA': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'VISA_APPLICATION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'ENROLLMENT': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
      };

      // Special validation: If moving FROM Document Collection, ensure all required documents are uploaded
      if (currentPhase === 'DOCUMENT_COLLECTION' && newPhase !== 'DOCUMENT_COLLECTION') {
        const docCollectionRequired = phaseRequirements['DOCUMENT_COLLECTION'] || [];
        if (docCollectionRequired.length > 0) {
          const uploadedDocs = await Document.findAll({
            where: {
              studentId: req.params.id,
              type: docCollectionRequired,
              status: ['PENDING', 'APPROVED']
            }
          });

          const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
          const missingDocs = docCollectionRequired.filter(docType => !uploadedDocTypes.includes(docType));

          if (missingDocs.length > 0) {
            return res.status(400).json({
              message: `Cannot proceed to ${newPhase.replace(/_/g, ' ')} phase. Document Collection phase is not complete. All required documents (PASSPORT, ACADEMIC_TRANSCRIPT, RECOMMENDATION_LETTER, STATEMENT_OF_PURPOSE, CV_RESUME) must be uploaded before moving to the next phase.`,
              missingDocuments: missingDocs
            });
          }
        }
      }

      // Check if moving to a phase that requires documents
      const requiredDocs = phaseRequirements[newPhase] || [];
      if (requiredDocs.length > 0) {
        const uploadedDocs = await Document.findAll({
          where: {
            studentId: req.params.id,
            type: requiredDocs,
            status: ['PENDING', 'APPROVED']
          }
        });

        const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
        const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));

        if (missingDocs.length > 0) {
          return res.status(400).json({
            message: `Cannot move to ${newPhase.replace(/_/g, ' ')} phase. Missing required documents: ${missingDocs.join(', ')}`,
            missingDocuments: missingDocs
          });
        }
      }
    }

    const previousTargetCountries = student.targetCountries;
    await student.update(req.body);

    // Auto-create country profiles if targetCountries changed
    if (req.body.targetCountries && req.body.targetCountries !== previousTargetCountries) {
      await autoCreateCountryProfilesFromTargetCountries(student.id, req.body.targetCountries);
    }

    // Create activity for phase change
    if (req.body.currentPhase && req.body.currentPhase !== student.currentPhase) {
      await Activity.create({
        type: 'PHASE_CHANGE',
        description: `Student moved from ${student.currentPhase.replace(/_/g, ' ')} to ${req.body.currentPhase.replace(/_/g, ' ')}`,
        studentId: req.params.id,
        userId: req.user.id,
        metadata: {
          previousPhase: student.currentPhase,
          newPhase: req.body.currentPhase
        }
      });

      // Notify marketing owner if student belongs to a marketing person
      if (student.marketingOwnerId) {
        try {
          const phaseLabels = {
            'DOCUMENT_COLLECTION': 'Document Collection',
            'UNIVERSITY_SHORTLISTING': 'University Shortlisting',
            'APPLICATION_SUBMISSION': 'Application Submission',
            'OFFER_RECEIVED': 'Offer Received',
            'INITIAL_PAYMENT': 'Initial Payment',
            'INTERVIEW': 'Interview',
            'FINANCIAL_TB_TEST': 'Financial & TB Test',
            'CAS_VISA': 'CAS & Visa',
            'VISA_APPLICATION': 'Visa Process',
            'ENROLLMENT': 'Enrollment'
          };

          await Notification.create({
            userId: student.marketingOwnerId,
            type: 'application_progress',
            title: `Application Progress Updated: ${student.firstName} ${student.lastName}`,
            message: `Application progress has been updated from ${phaseLabels[student.currentPhase] || student.currentPhase.replace(/_/g, ' ')} to ${phaseLabels[req.body.currentPhase] || req.body.currentPhase.replace(/_/g, ' ')}.`,
            priority: 'medium',
            leadId: student.id,
            isRead: false,
            metadata: {
              previousPhase: student.currentPhase,
              newPhase: req.body.currentPhase,
              studentName: `${student.firstName} ${student.lastName}`
            }
          });
        } catch (notifError) {
          console.error('Error creating notification for marketing owner:', notifError);
          // Don't fail the request if notification creation fails
        }
      }
    }

    // Clear dashboard cache to ensure stats update
    const cacheKey = `dashboard:${req.user.id}`;
    await cacheUtils.del(cacheKey);
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student' });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const deleted = await Student.destroy({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Clear dashboard cache to ensure stats update
    const cacheKey = `dashboard:${req.user.id}`;
    await cacheUtils.del(cacheKey);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
};

// Get student documents
exports.getStudentDocuments = async (req, res) => {
  try {
    const { type, status } = req.query;
    
    // First, verify the student belongs to this counselor
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    // Build where clause for documents
    const whereClause = {
      studentId: req.params.id
    };
    
    if (type) {
      whereClause.type = type;
    }
    if (status) {
      whereClause.status = status;
    }
    const documents = await Document.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching student documents:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching student documents' 
    });
  }
};

// Upload document method removed - now using documentController.uploadDocument for DigitalOcean Spaces

// Upload document with file method removed - now using documentController.uploadDocument for DigitalOcean Spaces

// Create document (metadata-only, no file upload)
exports.createDocument = async (req, res) => {
  try {
    const { type, name, description, status, expiryDate, issueDate, issuingAuthority, documentNumber, countryOfIssue, remarks, priority } = req.body;

    // Verify student belongs to counselor
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create document record in database (metadata-only)
    const document = await Document.create({
      name: name || 'Untitled Document',
      type: type || 'OTHER',
      description: description || '',
      path: 'metadata-only', // Special path for metadata-only documents
      url: null, // No file URL for metadata-only documents
      mimeType: 'application/json', // Metadata documents are JSON
      size: 0, // No file size for metadata-only documents
      studentId: req.params.id,
      status: status || 'PENDING',
      uploadedBy: req.user.id,
      expiryDate: expiryDate || null,
      issueDate: issueDate || null,
      issuingAuthority: issuingAuthority || null,
      documentNumber: documentNumber || null,
      countryOfIssue: countryOfIssue || null,
      remarks: remarks || null,
      priority: priority || 'MEDIUM'
    });
    // Create activity for document creation
    await Activity.create({
      type: 'DOCUMENT_CREATED',
      description: `Document created: ${document.name} (${document.type})`,
      studentId: req.params.id,
      userId: req.user.id,
      metadata: {
        documentId: document.id,
        documentType: document.type,
        documentName: document.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: {
        id: document.id,
        name: document.name,
        type: document.type,
        description: document.description,
        status: document.status,
        createdAt: document.createdAt,
        expiryDate: document.expiryDate,
        issueDate: document.issueDate,
        issuingAuthority: document.issuingAuthority,
        documentNumber: document.documentNumber,
        countryOfIssue: document.countryOfIssue,
        remarks: document.remarks,
        priority: document.priority
      }
    });
  } catch (error) {
    console.error('❌ Error creating document:', error);
    res.status(500).json({
      message: 'Error creating document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }]
    });
    if (!document) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }

    // Check if this is a metadata-only document (like academic records)
    if (document.mimeType === 'application/json' || document.path.includes('metadata')) {
      // For metadata documents, create a JSON file for download
      const documentData = {
        name: document.name,
        type: document.type,
        description: document.description,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      };

      // Convert to JSON string
      const jsonContent = JSON.stringify(documentData, null, 2);
      
      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}.json"`);
      res.setHeader('Content-Length', Buffer.byteLength(jsonContent, 'utf8'));
      
      // Send the JSON content
      res.send(jsonContent);
      return;
    }

    // Check if file exists for physical files
    const fs = require('fs');
    const path = require('path');
    
    // Handle file path - try multiple possible locations
    let filePath = null;
    const possiblePaths = [
      document.path, // Original path
      path.join(__dirname, '..', 'uploads', 'documents', path.basename(document.path)), // Relative to uploads/documents
      path.join(__dirname, '..', '..', 'uploads', 'documents', path.basename(document.path)), // One level up
      path.join(process.cwd(), 'uploads', 'documents', path.basename(document.path)), // From project root
      path.join(__dirname, '..', 'uploads', path.basename(document.path)), // Fallback to uploads
      path.join(process.cwd(), 'uploads', path.basename(document.path)) // Fallback from project root
    ];
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    if (!filePath) {
      console.error('File not found for document:', document.id, 'Path:', document.path);
      console.error('Tried paths:', possiblePaths);
      return res.status(404).json({ 
        message: 'Document file is not available locally. This may be because the file was uploaded to a different server environment.',
        errorType: 'FILE_NOT_FOUND_LOCALLY'
      });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    
    // Get file stats for content length
    const stats = fs.statSync(filePath);
    res.setHeader('Content-Length', stats.size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Error downloading document' });
  }
};

// Preview document
exports.previewDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }]
    });
    if (!document) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }

    // Check if this is a metadata-only document (like academic records)
    if (document.mimeType === 'application/json' || document.path.includes('metadata')) {
      // For metadata documents, return the data as JSON for preview
      const documentData = {
        name: document.name,
        type: document.type,
        description: document.description,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      };

      res.json({
        previewable: true,
        message: 'Metadata document preview',
        document: documentData,
        contentType: 'application/json'
      });
      return;
    }

    // Check if file exists for physical files
    const fs = require('fs');
    const path = require('path');
    
    // Handle file path - try multiple possible locations
    let filePath = null;
    const possiblePaths = [
      document.path, // Original path
      path.join(__dirname, '..', 'uploads', 'documents', path.basename(document.path)), // Relative to uploads/documents
      path.join(__dirname, '..', '..', 'uploads', 'documents', path.basename(document.path)), // One level up
      path.join(process.cwd(), 'uploads', 'documents', path.basename(document.path)), // From project root
      path.join(__dirname, '..', 'uploads', path.basename(document.path)), // Fallback to uploads
      path.join(process.cwd(), 'uploads', path.basename(document.path)) // Fallback from project root
    ];
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }
    
    if (!filePath) {
      console.error('File not found for document:', document.id, 'Path:', document.path);
      console.error('Tried paths:', possiblePaths);
      
      // Return document metadata instead of 404 for missing files
      return res.json({
        previewable: false,
        message: 'Document file is not available locally. This may be because the file was uploaded to a different server environment.',
        document: {
          id: document.id,
          name: document.name,
          type: document.type,
          mimeType: document.mimeType,
          size: document.size,
          path: document.path,
          status: document.status,
          createdAt: document.createdAt
        },
        errorType: 'FILE_NOT_FOUND_LOCALLY'
      });
    }

    // Check if file type is previewable
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (previewableTypes.includes(document.mimeType)) {
      // Set appropriate headers for preview
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.name}"`);
      
      // Get file stats for content length
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Length', stats.size);

      // Stream the file for preview
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // For non-previewable files, return file info
      res.json({
        previewable: false,
        message: 'This file type cannot be previewed. Please download to view.',
        document: {
          id: document.id,
          name: document.name,
          type: document.type,
          mimeType: document.mimeType,
          size: document.size
        }
      });
    }
  } catch (error) {
    console.error('Error previewing document:', error);
    res.status(500).json({ message: 'Error previewing document' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    // First find the document and verify it belongs to a student of this counselor
    const document = await Document.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: ['id']
      }]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }
    // Delete the document
    await document.destroy();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
};

// Update document
exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }]
    });

    if (!document) {
      return res.status(404).json({ 
        success: false,
        message: 'Document not found' 
      });
    }

    // Update document fields
    const updateFields = {};
    if (req.body.name !== undefined) updateFields.name = req.body.name;
    if (req.body.description !== undefined) updateFields.description = req.body.description;
    if (req.body.status !== undefined) updateFields.status = req.body.status;
    if (req.body.type !== undefined) updateFields.type = req.body.type;

    await document.update(updateFields);

    // Fetch updated document with associations
    const updatedDocument = await Document.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update document. Please try again later.' 
    });
  }
};

// Get all documents for counselor
exports.getAllDocuments = async (req, res) => {
  try {
    const { search, status, type, sort, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    // Build order clause
    let orderClause = [['createdAt', 'DESC']];
    if (sort) {
      const [field, direction] = sort.split('_');
      let dbField = field;
      if (field === 'date') dbField = 'createdAt'; // Map 'date' to 'createdAt'
      orderClause = [[dbField, direction.toUpperCase()]];
    }

    const documents = await Document.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter by search if provided
    let filteredDocuments = documents.rows;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocuments = documents.rows.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        doc.student.firstName.toLowerCase().includes(searchLower) ||
        doc.student.lastName.toLowerCase().includes(searchLower) ||
        doc.type.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: {
        documents: filteredDocuments,
        total: documents.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(documents.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load documents. Please try again later.' 
    });
  }
};

// Get student applications
exports.getStudentApplications = async (req, res) => {
  try {
    const applications = await StudentUniversityApplication.findAll({
      where: { studentId: req.params.id },
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: []
        },
        {
          model: University,
          as: 'university'
        }
      ]
    });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching student applications' 
    });
  }
};

// Get all applications
exports.getApplications = async (req, res) => {
  try {
    const { 
      search, 
      status, 
      studentId, 
      universityId, 
      sort = 'deadline_asc', 
      page = 1, 
      limit = 10 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const whereClause = {};
    
    if (status && status !== 'ALL') {
      whereClause.applicationStatus = status;
    }
    
    if (studentId && studentId !== 'ALL') {
      whereClause.studentId = studentId;
    }
    
    if (universityId && universityId !== 'ALL') {
      whereClause.universityId = universityId;
    }

    // Build order clause
    let orderClause = [['applicationDeadline', 'ASC']];
    if (sort) {
      const [field, direction] = sort.split('_');
      switch (field) {
        case 'deadline':
          orderClause = [['applicationDeadline', direction.toUpperCase()]];
          break;
        case 'created':
          orderClause = [['createdAt', direction.toUpperCase()]];
          break;
        case 'student':
          orderClause = [[{ model: Student, as: 'student' }, 'firstName', direction.toUpperCase()]];
          break;
        case 'university':
          orderClause = [[{ model: University, as: 'university' }, 'name', direction.toUpperCase()]];
          break;
        default:
          orderClause = [['applicationDeadline', 'ASC']];
      }
    }

    // Build search conditions
    let searchConditions = {};
    if (search) {
      searchConditions = {
        [Op.or]: [
          { courseName: { [Op.like]: `%${search}%` } },
          { notes: { [Op.like]: `%${search}%` } },
          { '$student.firstName$': { [Op.like]: `%${search}%` } },
          { '$student.lastName$': { [Op.like]: `%${search}%` } },
          { '$university.name$': { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: applications } = await StudentUniversityApplication.findAndCountAll({
      where: {
        ...whereClause,
        ...searchConditions
      },
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: true
        },
        {
          model: University,
          as: 'university',
          attributes: ['id', 'name', 'country'],
          required: true
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Map applicationStatus to status for frontend compatibility
    const mappedApplications = applications.map(app => {
      const appData = app.toJSON();
      return {
        ...appData,
        status: appData.applicationStatus, // Map applicationStatus to status
        // Keep applicationStatus for backward compatibility
        applicationStatus: appData.applicationStatus
      };
    });

    res.json({
      success: true,
      data: {
        applications: mappedApplications,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching applications' 
    });
  }
};

// Create application
exports.createApplication = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        id: req.body.studentId,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Prepare application data with defaults for required fields
    const applicationData = {
      studentId: req.body.studentId,
      universityId: req.body.universityId,
      courseName: req.body.courseName,
      courseLevel: req.body.courseLevel || 'UNDERGRADUATE',
      intakeTerm: req.body.intakeTerm || 'FALL_2024',
      applicationDeadline: req.body.applicationDeadline,
      applicationStatus: req.body.applicationStatus || req.body.status || 'PENDING',
      applicationFee: req.body.applicationFee ? parseFloat(req.body.applicationFee) : null,
      applicationFeePaid: req.body.applicationFeePaid || false,
      priority: req.body.priority ? parseInt(req.body.priority) : 1,
      isPrimaryChoice: req.body.isPrimaryChoice || false,
      isBackupChoice: req.body.isBackupChoice || false,
      notes: req.body.notes || '',
      counselorNotes: req.body.counselorNotes || '',
      studentNotes: req.body.studentNotes || ''
    };

    // Validate required fields
    if (!applicationData.universityId || !applicationData.courseName || !applicationData.applicationDeadline) {
      return res.status(400).json({ 
        message: 'University, course name, and application deadline are required' 
      });
    }

    const application = await StudentUniversityApplication.create(applicationData);

    const newApplication = await StudentUniversityApplication.findOne({
      where: { id: application.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: University,
          as: 'university',
          attributes: ['id', 'name', 'country']
        }
      ]
    });

    res.status(201).json(newApplication);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ 
      message: 'Error creating application',
      error: error.message 
    });
  }
};

// Update application
exports.updateApplication = async (req, res) => {
  try {
    // First check if the application belongs to a student of this counselor
    const application = await StudentUniversityApplication.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: ['id']
      }]
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Prepare update data with proper field handling
    const updateData = {
      universityId: req.body.universityId,
      courseName: req.body.courseName,
      courseLevel: req.body.courseLevel,
      intakeTerm: req.body.intakeTerm,
      applicationDeadline: req.body.applicationDeadline,
      applicationStatus: req.body.applicationStatus || req.body.status,
      applicationFee: req.body.applicationFee ? parseFloat(req.body.applicationFee) : null,
      applicationFeePaid: req.body.applicationFeePaid,
      priority: req.body.priority ? parseInt(req.body.priority) : 1,
      isPrimaryChoice: req.body.isPrimaryChoice,
      isBackupChoice: req.body.isBackupChoice,
      notes: req.body.notes,
      counselorNotes: req.body.counselorNotes,
      studentNotes: req.body.studentNotes
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update the application
    await StudentUniversityApplication.update(updateData, {
      where: { id: req.params.id }
    });

    // Fetch the updated application with associations
    const updatedApplication = await StudentUniversityApplication.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'marketingOwnerId']
        },
        {
          model: University,
          as: 'university',
          attributes: ['id', 'name', 'country']
        }
      ]
    });

    // Check if application status changed and notify marketing owner
    const oldStatus = application.applicationStatus;
    const newStatus = updatedApplication.applicationStatus;
    
    if (oldStatus !== newStatus && updatedApplication.student?.marketingOwnerId) {
      try {
        const statusLabels = {
          'PENDING': 'Pending',
          'SUBMITTED': 'Submitted',
          'UNDER_REVIEW': 'Under Review',
          'ACCEPTED': 'Accepted',
          'REJECTED': 'Rejected',
          'DEFERRED': 'Deferred',
          'WAITLISTED': 'Waitlisted',
          'CONDITIONAL_OFFER': 'Conditional Offer'
        };

        await Notification.create({
          userId: updatedApplication.student.marketingOwnerId,
          type: 'application_update',
          title: `Application Status Updated: ${updatedApplication.student.firstName} ${updatedApplication.student.lastName}`,
          message: `Application to ${updatedApplication.university?.name || 'University'} has been updated from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}.`,
          priority: newStatus === 'ACCEPTED' ? 'high' : newStatus === 'REJECTED' ? 'high' : 'medium',
          leadId: updatedApplication.student.id,
          isRead: false,
          metadata: {
            applicationId: updatedApplication.id,
            oldStatus: oldStatus,
            newStatus: newStatus,
            universityName: updatedApplication.university?.name,
            courseName: updatedApplication.courseName
          }
        });
      } catch (notifError) {
        console.error('Error creating notification for marketing owner:', notifError);
        // Don't fail the request if notification creation fails
      }
    }

    res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ 
      message: 'Error updating application',
      error: error.message 
    });
  }
};

// Delete application
exports.deleteApplication = async (req, res) => {
  try {
    // First check if the application belongs to a student of this counselor
    const application = await StudentUniversityApplication.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: ['id']
      }]
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Delete the application
    await StudentUniversityApplication.destroy({
      where: { id: req.params.id }
    });

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ message: 'Error deleting application' });
  }
};

// Get country profiles for student
exports.getStudentCountryProfiles = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id, 10);

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }

    // Verify student belongs to counselor
    const student = await Student.findOne({
      where: { id: studentId, counselorId: req.user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or you do not have access to this student'
      });
    }

    // Get all country profiles for this student
    const countryProfiles = await ApplicationCountry.findAll({
      where: { studentId },
      order: [['preferredCountry', 'DESC'], ['country', 'ASC']]
    });

    res.json({
      success: true,
      data: countryProfiles
    });
  } catch (error) {
    console.error('Error fetching country profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching country profiles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Auto-create country profiles from selected countries/universities
exports.autoCreateCountryProfiles = async (req, res) => {
  try {
    const { studentId, countries } = req.body;

    if (!studentId || !countries || !Array.isArray(countries) || countries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and countries array are required'
      });
    }

    const studentIdInt = parseInt(studentId, 10);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }

    // Verify student belongs to counselor
    const student = await Student.findOne({
      where: { id: studentIdInt, counselorId: req.user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or you do not have access to this student'
      });
    }

    const createdProfiles = [];
    const existingProfiles = [];

    // Get existing country profiles
    const existingCountries = await ApplicationCountry.findAll({
      where: { studentId: studentIdInt },
      attributes: ['country']
    });
    const existingCountrySet = new Set(existingCountries.map(c => c.country));

    // Create profiles for new countries
    for (const country of countries) {
      if (existingCountrySet.has(country)) {
        existingProfiles.push(country);
        continue;
      }

      const countryProfile = await ApplicationCountry.create({
        studentId: studentIdInt,
        country,
        totalApplications: 0,
        primaryApplications: 0,
        backupApplications: 0,
        acceptedApplications: 0,
        rejectedApplications: 0,
        pendingApplications: 0,
        totalApplicationFees: 0,
        totalScholarshipAmount: 0,
        visaRequired: true,
        visaStatus: 'NOT_STARTED',
        preferredCountry: false,
        notes: `Country profile auto-created for ${country}. Application progress starts from beginning.`
      });

      createdProfiles.push(countryProfile);

      // Log activity
      await Activity.create({
        type: 'COUNTRY_PROFILE_CREATED',
        description: `Auto-created country profile for ${country}`,
        studentId: studentIdInt,
        userId: req.user.id,
        metadata: {
          country: country,
          autoCreated: true
        }
      });
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdProfiles.length} new country profile(s)`,
      data: {
        created: createdProfiles,
        existing: existingProfiles,
        totalCreated: createdProfiles.length,
        totalExisting: existingProfiles.length
      }
    });
  } catch (error) {
    console.error('Error auto-creating country profiles:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'One or more country profiles already exist'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error auto-creating country profiles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create country profile for student
exports.createCountryProfile = async (req, res) => {
  try {
    const { studentId, country } = req.body;

    console.log('Received request to create country profile:', { studentId, country, body: req.body });

    if (!studentId || !country) {
      console.log('Validation failed - missing studentId or country:', { studentId, country });
      return res.status(400).json({
        success: false,
        message: 'Student ID and country are required',
        received: { studentId, country }
      });
    }

    // Convert studentId to integer if it's a string
    const studentIdInt = parseInt(studentId, 10);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }

    // Verify student belongs to counselor
    const student = await Student.findOne({
      where: { id: studentIdInt, counselorId: req.user.id }
    });

    if (!student) {
      console.log('Student not found:', { studentId: studentIdInt, counselorId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Student not found or you do not have access to this student'
      });
    }

    // Check if country profile already exists
    const existingCountry = await ApplicationCountry.findOne({
      where: { studentId: studentIdInt, country }
    });

    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: `Country profile for ${country} already exists for this student`
      });
    }

    // Create new country profile - starts from beginning (DOCUMENT_COLLECTION phase)
    const countryProfile = await ApplicationCountry.create({
      studentId: studentIdInt,
      country,
      totalApplications: 0,
      primaryApplications: 0,
      backupApplications: 0,
      acceptedApplications: 0,
      rejectedApplications: 0,
      pendingApplications: 0,
      totalApplicationFees: 0,
      totalScholarshipAmount: 0,
      visaRequired: true,
      visaStatus: 'NOT_STARTED',
      preferredCountry: false,
      notes: `Country profile created for ${country}. Application progress starts from beginning.`
    });

    // Log activity
    await Activity.create({
      type: 'COUNTRY_PROFILE_CREATED',
      description: `Created country profile for ${country}`,
      studentId: studentIdInt,
      userId: req.user.id,
      metadata: {
        country: country
      }
    });

    res.status(201).json({
      success: true,
      message: `Country profile for ${country} created successfully`,
      data: countryProfile
    });
  } catch (error) {
    console.error('Error creating country profile:', error);
    
    // Handle Sequelize unique constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: `Country profile for ${req.body.country} already exists for this student`
      });
    }

    // Handle Sequelize validation error
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating country profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student notes
exports.getStudentNotes = async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { studentId: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching student notes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching student notes' 
    });
  }
};

// Add note
exports.addNote = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const note = await Note.create({
      ...req.body,
      studentId: req.params.id,
      counselorId: req.user.id
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Error adding note' });
  }
};

// Update note
exports.updateNote = async (req, res) => {
  try {
    const [updated] = await Note.update(req.body, {
      where: {
        id: req.params.noteId,
        studentId: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!updated) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = await Note.findByPk(req.params.noteId);
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Error updating note' });
  }
};

// Delete note
exports.deleteNote = async (req, res) => {
  try {
    const deleted = await Note.destroy({
      where: {
        id: req.params.noteId,
        studentId: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note' });
  }
};

// Get student activities
exports.getStudentActivities = async (req, res) => {
  try {
    // First, verify the student belongs to this counselor
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or access denied'
      });
    }
    
    // Fetch activities with LEFT JOIN for user (to handle missing users)
    const activities = await Activity.findAll({
      where: { studentId: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false // LEFT JOIN - include activities even if user is null
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching student activities:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching student activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get counselor tasks (all tasks for the counselor)
exports.getCounselorTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: {
        counselorId: req.user.id
      },
      include: [{
        model: Student,
        as: 'student',
        attributes: ['firstName', 'lastName', 'email'],
        required: false // LEFT JOIN to include tasks without students
      }],
      order: [['dueDate', 'ASC']]
    });

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Error fetching counselor tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
};

// Get student tasks
exports.getStudentTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { studentId: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }],
      order: [['dueDate', 'ASC']]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching student tasks:', error);
    res.status(500).json({ message: 'Error fetching student tasks' });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const task = await Task.create({
      ...req.body,
      studentId: req.params.id,
      counselorId: req.user.id
    });
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const [updated] = await Task.update(req.body, {
      where: {
        id: req.params.taskId,
        studentId: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!updated) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = await Task.findByPk(req.params.taskId);
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.destroy({
      where: {
        id: req.params.taskId,
        studentId: req.params.id,
        counselorId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
};

// Create general task (not tied to a specific student)
exports.createGeneralTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      counselorId: req.user.id,
      studentId: req.body.studentId || null // Allow null for general tasks
    };

    const task = await Task.create(taskData);
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating general task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
};

// Update general task
exports.updateGeneralTask = async (req, res) => {
  try {
    const [updated] = await Task.update(req.body, {
      where: {
        id: req.params.taskId,
        counselorId: req.user.id
      }
    });

    if (!updated) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = await Task.findByPk(req.params.taskId);
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating general task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
};

// Delete general task
exports.deleteGeneralTask = async (req, res) => {
  try {
    const deleted = await Task.destroy({
      where: {
        id: req.params.taskId,
        counselorId: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting general task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
};

// Get universities
exports.getUniversities = async (req, res) => {
  try {
    const { country, search, sort, page = 1, limit = 10 } = req.query;
    const { Op } = require('sequelize');
    
    const where = {};
    
    // Filter by country if provided
    if (country && country !== 'ALL') {
      where.country = country;
    }
    
    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Only show active universities for counselors
    where.active = true;
    
    // Build order clause
    let order = [['name', 'ASC']];
    if (sort) {
      const [field, direction] = sort.split('_');
      const validFields = ['name', 'country', 'ranking', 'acceptanceRate', 'createdAt'];
      const validDirections = ['ASC', 'DESC'];
      if (validFields.includes(field) && validDirections.includes(direction.toUpperCase())) {
        order = [[field, direction.toUpperCase()]];
      }
    }
    
    const universities = await University.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        universities: universities.rows,
        total: universities.count,
        page: parseInt(page),
        totalPages: Math.ceil(universities.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching universities' 
    });
  }
};

// Export students
exports.exportStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { counselorId: req.user.id },
      include: [
        {
          model: Document,
          as: 'documents'
        },
        {
          model: StudentUniversityApplication,
          as: 'applications',
          include: [{
            model: University,
            as: 'university'
          }]
        }
      ]
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'firstName', title: 'First Name' },
        { id: 'lastName', title: 'Last Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'currentPhase', title: 'Current Phase' },
        { id: 'status', title: 'Status' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });

    const records = students.map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      currentPhase: student.currentPhase,
      status: student.status,
      createdAt: student.createdAt
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting students:', error);
    res.status(500).json({ message: 'Error exporting students' });
  }
};

// Export documents
exports.exportDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      include: [{
        model: Student,
        as: 'student',
        where: {
          id: req.params.id,
          counselorId: req.user.id
        },
        attributes: []
      }]
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'type', title: 'Type' },
        { id: 'name', title: 'Name' },
        { id: 'status', title: 'Status' },
        { id: 'createdAt', title: 'Uploaded At' }
      ]
    });

    const records = documents.map(doc => ({
      id: doc.id,
      type: doc.type,
      name: doc.name,
      status: doc.status,
      createdAt: doc.createdAt
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=documents.csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting documents:', error);
    res.status(500).json({ message: 'Error exporting documents' });
  }
};

// Export applications
exports.exportApplications = async (req, res) => {
  try {
    const applications = await StudentUniversityApplication.findAll({
      where: { studentId: req.params.id },
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: []
        },
        {
          model: University,
          as: 'university'
        }
      ]
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'id', title: 'ID' },
        { id: 'university', title: 'University' },
        { id: 'programName', title: 'Program' },
        { id: 'intakeTerm', title: 'Intake Term' },
        { id: 'status', title: 'Status' },
        { id: 'applicationFee', title: 'Application Fee' },
        { id: 'applicationDeadline', title: 'Deadline' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });

    const records = applications.map(app => ({
      id: app.id,
      university: app.university.name,
      programName: app.programName,
      intakeTerm: app.intakeTerm,
      status: app.status,
      applicationFee: app.applicationFee,
      applicationDeadline: app.applicationDeadline,
      createdAt: app.createdAt
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting applications:', error);
    res.status(500).json({ message: 'Error exporting applications' });
  }
};

// Update student phase
exports.updateStudentPhase = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPhase, remarks, country } = req.body; // Add country parameter
    const counselorId = req.user.id;

    // Helper function to safely parse notes (handles both JSON strings and plain text)
    const safeParseNotes = (notes) => {
      if (!notes) return {};
      
      // If it's already an object, return it
      if (typeof notes === 'object' && notes !== null) {
        return notes;
      }
      
      // If it's a string, try to parse as JSON
      if (typeof notes === 'string') {
        const trimmed = notes.trim();
        // Check if it looks like JSON (starts with { or [)
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            return JSON.parse(notes);
          } catch (e) {
            console.error('Error parsing notes as JSON:', e);
            // If parsing fails, return empty object
            return {};
          }
        } else {
          // It's a plain string, return empty object (we can't merge with plain text)
          return {};
        }
      }
      
      return {};
    };

    // Validate phase
    const validPhases = [
      'DOCUMENT_COLLECTION',
      'UNIVERSITY_SHORTLISTING',
      'APPLICATION_SUBMISSION',
      'OFFER_RECEIVED',
      'INITIAL_PAYMENT',
      'INTERVIEW',
      'FINANCIAL_TB_TEST',
      'CAS_VISA',
      'VISA_APPLICATION',
      'ENROLLMENT'
    ];

    if (!validPhases.includes(currentPhase)) {
      return res.status(400).json({ message: 'Invalid phase' });
    }

    // Find student
    const student = await Student.findOne({
      where: {
        id,
        counselorId // Ensure the student belongs to this counselor
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if phase is being changed and validate document requirements
    if (currentPhase !== student.currentPhase) {
      const previousPhase = student.currentPhase;
      const newPhase = currentPhase;
      
      // Define required documents for each phase with detailed descriptions
      const phaseRequirements = {
        'DOCUMENT_COLLECTION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME'],
        'UNIVERSITY_SHORTLISTING': ['PASSPORT', 'ACADEMIC_TRANSCRIPT'],
        'APPLICATION_SUBMISSION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE'],
        'OFFER_RECEIVED': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE'],
        'INITIAL_PAYMENT': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
        'INTERVIEW': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
        'FINANCIAL_TB_TEST': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'CAS_VISA': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'VISA_APPLICATION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'ENROLLMENT': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
      };

      // Document descriptions for better user understanding
      const documentDescriptions = {
        'PASSPORT': 'Valid passport with at least 6 months validity',
        'ACADEMIC_TRANSCRIPT': 'Official academic transcripts from previous institutions',
        'RECOMMENDATION_LETTER': 'Recommendation letters from professors or employers',
        'STATEMENT_OF_PURPOSE': 'Statement of Purpose (SOP) explaining your academic and career goals',
        'CV_RESUME': 'Updated CV or Resume highlighting your qualifications and experience',
        'ENGLISH_TEST_SCORE': 'IELTS, TOEFL, or equivalent English proficiency test results',
        'FINANCIAL_STATEMENT': 'Bank statements showing sufficient funds for tuition and living expenses',
        'MEDICAL_CERTIFICATE': 'Medical examination certificate and TB test results'
      };

      // Phase descriptions for context
      const phaseDescriptions = {
        'UNIVERSITY_SHORTLISTING': 'To proceed with university selection, we need basic identification and academic records.',
        'APPLICATION_SUBMISSION': 'For university applications, English proficiency proof is required.',
        'INITIAL_PAYMENT': 'Before making payments, financial documentation is required to verify funding.',
        'INTERVIEW': 'Interview preparation requires all previous documents plus financial verification.',
        'FINANCIAL_TB_TEST': 'Visa preparation requires medical examination and TB test results.',
        'CAS_VISA': 'CAS and visa processing requires complete medical and financial documentation.',
        'VISA_APPLICATION': 'Visa Process requires all supporting documents including medical certificates.',
        'ENROLLMENT': 'Final enrollment requires complete documentation package.'
      };

      // Special validation: If moving FROM Document Collection, ensure all required documents are uploaded
      if (previousPhase === 'DOCUMENT_COLLECTION' && newPhase !== 'DOCUMENT_COLLECTION') {
        const docCollectionRequired = phaseRequirements['DOCUMENT_COLLECTION'] || [];
        if (docCollectionRequired.length > 0) {
          const uploadedDocs = await Document.findAll({
            where: {
              studentId: id,
              type: docCollectionRequired,
              status: ['PENDING', 'APPROVED']
            }
          });

          const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
          const missingDocs = docCollectionRequired.filter(docType => !uploadedDocTypes.includes(docType));

          if (missingDocs.length > 0) {
            const missingDocsList = missingDocs.map(docType => 
              `• ${docType.replace(/_/g, ' ')}: ${documentDescriptions[docType] || 'Required document'}`
            ).join('\n');

            const detailedMessage = `Cannot proceed to ${newPhase.replace(/_/g, ' ')} phase

Document Collection phase is not complete. All required documents must be uploaded before moving to the next phase.

 Missing Required Documents:
${missingDocsList}

 Next Steps:
1. Upload all missing documents in the Documents section
2. Ensure documents are in PDF, JPG, or PNG format
3. Wait for document approval (if applicable)
4. Try changing the phase again

Need help? Contact your counselor for assistance.`;

            return res.status(400).json({
              message: detailedMessage,
              missingDocuments: missingDocs,
              phaseName: newPhase.replace(/_/g, ' '),
              phaseDescription: 'Document Collection phase must be completed before proceeding',
              documentDetails: missingDocs.map(docType => ({
                type: docType,
                description: documentDescriptions[docType] || 'Required document'
              }))
            });
          }
        }
      }

      // Check if moving to a phase that requires documents
      const requiredDocs = phaseRequirements[newPhase] || [];
      if (requiredDocs.length > 0) {
        const uploadedDocs = await Document.findAll({
          where: {
            studentId: id,
            type: requiredDocs,
            status: ['PENDING', 'APPROVED']
          }
        });

        const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
        const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));

        if (missingDocs.length > 0) {
          // Create detailed missing documents list
          const missingDocsList = missingDocs.map(docType => 
            `• ${docType.replace(/_/g, ' ')}: ${documentDescriptions[docType] || 'Required document'}`
          ).join('\n');

          // Create comprehensive error message
          const phaseName = newPhase.replace(/_/g, ' ');
          const phaseDescription = phaseDescriptions[newPhase] || '';
          
          const detailedMessage = `Cannot proceed to ${phaseName} phase

${phaseDescription}

 Missing Required Documents:
${missingDocsList}

 Next Steps:
1. Upload the missing documents in the Documents section
2. Ensure documents are in PDF, JPG, or PNG format
3. Wait for document approval (if applicable)
4. Try changing the phase again

Need help? Contact your counselor for assistance.`;

          return res.status(400).json({
            message: detailedMessage,
            missingDocuments: missingDocs,
            phaseName: phaseName,
            phaseDescription: phaseDescription,
            documentDetails: missingDocs.map(docType => ({
              type: docType,
              description: documentDescriptions[docType] || 'Required document'
            }))
          });
        }
      }
    }

    let previousPhase = student.currentPhase;
    let countryProfile = null;
    
    // If country is provided, update country-specific phase
    if (country) {
      countryProfile = await ApplicationCountry.findOne({
        where: { studentId: id, country }
      });

      if (!countryProfile) {
        return res.status(404).json({
          message: `Country profile for ${country} not found. Please create a country profile first.`
        });
      }

      previousPhase = countryProfile.currentPhase;
      await countryProfile.update({ 
        currentPhase,
        lastUpdated: new Date()
      });
    } else {
      // Backward compatibility: update global student phase if no country specified
      await student.update({ currentPhase });
    }

    // If moving to University Shortlisting phase, save selected universities
    if (currentPhase === 'UNIVERSITY_SHORTLISTING' && req.body.selectedUniversities && Array.isArray(req.body.selectedUniversities)) {
      const { selectedUniversities } = req.body;
      
      // Verify all university IDs exist
      const validUniversities = await University.findAll({
        where: {
          id: selectedUniversities,
          active: true
        }
      });

      if (validUniversities.length !== selectedUniversities.length) {
        return res.status(400).json({
          message: 'Some selected universities are invalid or inactive',
          invalidCount: selectedUniversities.length - validUniversities.length
        });
      }

      // Create shortlist entries grouped by country
      const shortlistData = {
        universities: validUniversities.map(u => ({
          id: u.id,
          name: u.name,
          country: u.country,
          city: u.city
        })),
        selectedAt: new Date().toISOString()
      };

      // If country is specified, store shortlist in country profile notes
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        const updatedCountryNotes = {
          ...countryNotes,
          universityShortlist: shortlistData
        };
        await countryProfile.update({ 
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        // Store in student notes for backward compatibility
        const existingNotes = safeParseNotes(student.notes);
        const updatedNotes = {
          ...existingNotes,
          universityShortlist: shortlistData
        };
        await student.update({ notes: JSON.stringify(updatedNotes) });
      }
    }

    // If moving to Application Submission phase, save selected universities
    if (currentPhase === 'APPLICATION_SUBMISSION' && req.body.selectedUniversities && Array.isArray(req.body.selectedUniversities)) {
      const { selectedUniversities } = req.body;
      
      // Get existing shortlisted universities - check country profile first if country is specified
      let shortlist = null;
      let existingNotes = {};
      
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        shortlist = countryNotes?.universityShortlist;
        existingNotes = countryNotes;
      } else {
        existingNotes = safeParseNotes(student.notes);
        shortlist = existingNotes?.universityShortlist;
      }
      
      if (!shortlist || !shortlist.universities || shortlist.universities.length === 0) {
        return res.status(400).json({
          message: 'No shortlisted universities found. Please shortlist universities first in the University Shortlisting phase.'
        });
      }

      // Verify selected universities are from the shortlisted ones
      const shortlistedIds = shortlist.universities.map(u => u.id);
      const invalidSelections = selectedUniversities.filter(id => !shortlistedIds.includes(id));
      
      if (invalidSelections.length > 0) {
        return res.status(400).json({
          message: 'Some selected universities are not in the shortlisted universities. Please select only from shortlisted universities.',
          invalidIds: invalidSelections
        });
      }

      // Get full university details for selected ones from shortlist
      const selectedUniversityData = shortlist.universities.filter(u => 
        selectedUniversities.includes(u.id)
      );

      // Create application submission universities data
      const applicationSubmissionData = {
        universities: selectedUniversityData.map(u => ({
          id: u.id,
          name: u.name,
          country: u.country,
          city: u.city
        })),
        submittedAt: new Date().toISOString()
      };

      // If country is specified, store in country profile notes
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        const updatedCountryNotes = {
          ...countryNotes,
          applicationSubmissionUniversities: applicationSubmissionData
        };
        await countryProfile.update({ 
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        // Store in student notes for backward compatibility
        const existingNotes = safeParseNotes(student.notes);
        const updatedNotes = {
          ...existingNotes,
          applicationSubmissionUniversities: applicationSubmissionData
        };
        await student.update({ notes: JSON.stringify(updatedNotes) });
      }
    }

    // If moving to Offer Received phase, save selected universities with offers
    if (currentPhase === 'OFFER_RECEIVED' && req.body.selectedUniversities && Array.isArray(req.body.selectedUniversities)) {
      const { selectedUniversities } = req.body;
      
      // Get existing universities from Application Submission phase first, then fallback to shortlisted
      let applicationUniversities = null;
      let shortlist = null;
      let existingNotes = {};
      
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        applicationUniversities = countryNotes?.applicationSubmissionUniversities;
        shortlist = countryNotes?.universityShortlist;
        existingNotes = countryNotes;
      } else {
        existingNotes = safeParseNotes(student.notes);
        applicationUniversities = existingNotes?.applicationSubmissionUniversities;
        shortlist = existingNotes?.universityShortlist;
      }
      
      // Determine which universities list to use: Application Submission first, then fallback to shortlist
      let availableUniversities = null;
      if (applicationUniversities && applicationUniversities.universities && applicationUniversities.universities.length > 0) {
        availableUniversities = applicationUniversities.universities;
      } else if (shortlist && shortlist.universities && shortlist.universities.length > 0) {
        availableUniversities = shortlist.universities;
      }
      
      if (!availableUniversities || availableUniversities.length === 0) {
        return res.status(400).json({
          message: 'No universities found from Application Submission phase. Please submit applications first in the Application Submission phase.'
        });
      }

      // Verify selected universities are from the available ones
      const availableIds = availableUniversities.map(u => u.id);
      const invalidSelections = selectedUniversities.filter(id => !availableIds.includes(id));
      
      if (invalidSelections.length > 0) {
        return res.status(400).json({
          message: 'Some selected universities are not in the submitted applications',
          invalidIds: invalidSelections
        });
      }

      // Get full university details for selected ones
      const selectedUniversityData = availableUniversities.filter(u => 
        selectedUniversities.includes(u.id)
      );

      // Store universities with offers
      const offersData = {
        universities: selectedUniversityData.map(u => ({
          id: u.id,
          name: u.name,
          country: u.country,
          city: u.city
        })),
        receivedAt: new Date().toISOString()
      };

      // Store in country profile if country is specified, otherwise in student notes
      if (country && countryProfile) {
        const updatedCountryNotes = {
          ...existingNotes,
          universitiesWithOffers: offersData
        };
        await countryProfile.update({ 
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        const updatedNotes = {
          ...existingNotes,
          universitiesWithOffers: offersData
        };
        await student.update({ notes: JSON.stringify(updatedNotes) });
      }
    }

    // If moving to Initial Payment phase, save selected university for payment
    if (currentPhase === 'INITIAL_PAYMENT' && req.body.selectedUniversity) {
      const { selectedUniversity } = req.body;
      
      // Get existing universities with offers - check country profile first if country is specified
      let offers = null;
      let shortlist = null;
      let existingNotes = {};
      
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        offers = countryNotes?.universitiesWithOffers;
        shortlist = countryNotes?.universityShortlist;
        existingNotes = countryNotes;
      } else {
        existingNotes = safeParseNotes(student.notes);
        offers = existingNotes?.universitiesWithOffers;
        shortlist = existingNotes?.universityShortlist;
      }
      
      // Determine which universities list to use: offers first, then fallback to shortlisted
      let availableUniversities = null;
      let isFallback = false;
      
      if (offers && offers.universities && offers.universities.length > 0) {
        availableUniversities = offers.universities;
        isFallback = false;
      } else if (shortlist && shortlist.universities && shortlist.universities.length > 0) {
        availableUniversities = shortlist.universities;
        isFallback = true;
      }
      
      if (!availableUniversities || availableUniversities.length === 0) {
        return res.status(400).json({
          message: 'No universities found. Please shortlist universities first in the University Shortlisting phase.'
        });
      }

      // Verify selected university is from the available universities list
      const selectedUniversityData = availableUniversities.find(u => u.id === selectedUniversity);
      
      if (!selectedUniversityData) {
        return res.status(400).json({
          message: 'Selected university is not in the available universities list'
        });
      }

      // Store selected university for initial payment
      const paymentData = {
        university: {
          id: selectedUniversityData.id,
          name: selectedUniversityData.name,
          country: selectedUniversityData.country,
          city: selectedUniversityData.city
        },
        selectedAt: new Date().toISOString(),
        isFallback: isFallback // Track if this was selected from shortlist (fallback)
      };

      // Store in country profile if country is specified, otherwise in student notes
      if (country && countryProfile) {
        const updatedCountryNotes = {
          ...existingNotes,
          initialPaymentUniversity: paymentData
        };
        await countryProfile.update({ 
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        const updatedNotes = {
          ...existingNotes,
          initialPaymentUniversity: paymentData
        };
        await student.update({ notes: JSON.stringify(updatedNotes) });
      }
    }

    // If moving to Interview phase or updating Interview status, save interview status
    if (currentPhase === 'INTERVIEW' && req.body.interviewStatus) {
      const { interviewStatus } = req.body;
      
      // Validate interview status
      if (!['APPROVED', 'REFUSED', 'STOPPED'].includes(interviewStatus)) {
        return res.status(400).json({
          message: 'Invalid interview status. Must be APPROVED, REFUSED, or STOPPED.'
        });
      }

      // Store interview status
      const interviewData = {
        status: interviewStatus,
        updatedAt: new Date().toISOString()
      };

      // If country is specified, store in country profile notes
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        const updatedCountryNotes = {
          ...countryNotes,
          interviewStatus: interviewData
        };
        await countryProfile.update({ 
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        // Store in student notes for backward compatibility
        const existingNotes = safeParseNotes(student.notes);
        const updatedNotes = {
          ...existingNotes,
          interviewStatus: interviewData
        };
        await student.update({ notes: JSON.stringify(updatedNotes) });
      }
    }

    // If moving to CAS & Visa phase or updating CAS & Visa status, save CAS & Visa status
    if (currentPhase === 'CAS_VISA' && req.body.casVisaStatus) {
      const { casVisaStatus } = req.body;
      
      // Validate CAS & Visa status
      if (!['APPROVED', 'REFUSED', 'STOPPED'].includes(casVisaStatus)) {
        return res.status(400).json({
          message: 'Invalid CAS & Visa status. Must be APPROVED, REFUSED, or STOPPED.'
        });
      }

      // Store CAS & Visa status
      const casVisaData = {
        status: casVisaStatus,
        updatedAt: new Date().toISOString()
      };

      // If country is specified, store in country profile notes
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        const updatedCountryNotes = {
          ...countryNotes,
          casVisaStatus: casVisaData
        };
        await countryProfile.update({ 
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        // Store in student notes for backward compatibility
        const existingNotes = safeParseNotes(student.notes);
        const updatedNotes = {
          ...existingNotes,
          casVisaStatus: casVisaData
        };
        await student.update({ notes: JSON.stringify(updatedNotes) });
      }
    }

    // If moving to Visa Process phase or updating Visa status, save Visa status
    if (currentPhase === 'VISA_APPLICATION' && req.body.visaStatus) {
      const { visaStatus } = req.body;
      
      // Validate Visa status
      if (!['APPROVED', 'REFUSED', 'STOPPED'].includes(visaStatus)) {
        return res.status(400).json({
          message: 'Invalid Visa status. Must be APPROVED, REFUSED, or STOPPED.'
        });
      }

      // Store Visa status
      const visaData = {
        status: visaStatus,
        updatedAt: new Date().toISOString()
      };

      // If country is specified, store in country profile notes
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        const updatedCountryNotes = {
          ...countryNotes,
          visaStatus: visaData
        };
        await countryProfile.update({ 
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        // Store in student notes for backward compatibility
        const existingNotes = safeParseNotes(student.notes);
        const updatedNotes = {
          ...existingNotes,
          visaStatus: visaData
        };
        await student.update({ notes: JSON.stringify(updatedNotes) });
      }
    }

    // If moving to Financial & TB Test phase, save financial option
    if (currentPhase === 'FINANCIAL_TB_TEST' && req.body.financialOption) {
      const { financialOption } = req.body;
      
      // Validate financial option
      if (!['LOAN', 'SELF_AMOUNT', 'OTHERS'].includes(financialOption)) {
        return res.status(400).json({
          message: 'Invalid financial option. Must be LOAN, SELF_AMOUNT, or OTHERS.'
        });
      }

      // Get existing notes
      const existingNotes = safeParseNotes(student.notes);
      
      // Map values to display labels
      const financialOptionLabels = {
        'LOAN': 'Loan',
        'SELF_AMOUNT': 'Self amount',
        'OTHERS': 'Others'
      };
      
      // Store financial option
      const financialData = {
        option: financialOption,
        label: financialOptionLabels[financialOption],
        selectedAt: new Date().toISOString()
      };

      const updatedNotes = {
        ...existingNotes,
        financialOption: financialData
      };
      
      await student.update({ notes: JSON.stringify(updatedNotes) });
    }

    // Create activity log entry for phase change
    let activityDescription;
    const countryPrefix = country ? `[${country}] ` : '';
    
    if (previousPhase === currentPhase && currentPhase === 'INTERVIEW' && req.body.interviewStatus) {
      // Just updating interview status without changing phase
      const statusLabels = {
        'APPROVED': 'Approved',
        'REFUSED': 'Refused',
        'STOPPED': 'Stopped'
      };
      activityDescription = remarks 
        ? `${countryPrefix}Interview status updated to ${statusLabels[req.body.interviewStatus]}. Remarks: ${remarks}`
        : `${countryPrefix}Interview status updated to ${statusLabels[req.body.interviewStatus]}`;
    } else if (previousPhase === currentPhase && currentPhase === 'CAS_VISA' && req.body.casVisaStatus) {
      // Just updating CAS & Visa status without changing phase
      const statusLabels = {
        'APPROVED': 'Approved',
        'REFUSED': 'Refused',
        'STOPPED': 'Stopped'
      };
      activityDescription = remarks 
        ? `${countryPrefix}CAS Process status updated to ${statusLabels[req.body.casVisaStatus]}. Remarks: ${remarks}`
        : `${countryPrefix}CAS Process status updated to ${statusLabels[req.body.casVisaStatus]}`;
    } else if (previousPhase === currentPhase && currentPhase === 'VISA_APPLICATION' && req.body.visaStatus) {
      // Just updating Visa status without changing phase
      const statusLabels = {
        'APPROVED': 'Approved',
        'REFUSED': 'Refused',
        'STOPPED': 'Stopped'
      };
      activityDescription = remarks 
        ? `${countryPrefix}Visa Process status updated to ${statusLabels[req.body.visaStatus]}. Remarks: ${remarks}`
        : `${countryPrefix}Visa Process status updated to ${statusLabels[req.body.visaStatus]}`;
    } else {
      // Normal phase change
      activityDescription = remarks 
        ? `${countryPrefix}Phase changed from ${previousPhase.replace(/_/g, ' ')} to ${currentPhase.replace(/_/g, ' ')}. Remarks: ${remarks}`
        : `${countryPrefix}Phase changed from ${previousPhase.replace(/_/g, ' ')} to ${currentPhase.replace(/_/g, ' ')}`;
    }
    try {
      const activity = await Activity.create({
        type: 'PHASE_CHANGE',
        description: activityDescription,
        studentId: student.id,
        userId: counselorId,
        metadata: {
          previousPhase,
          newPhase: currentPhase,
          remarks: remarks || null,
          country: country || null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (activityError) {
      console.error(' Error creating phase change activity:', activityError);
    }

    // Notify marketing owner if student belongs to a marketing person
    if (student.marketingOwnerId) {
      try {
        const phaseLabels = {
          'DOCUMENT_COLLECTION': 'Document Collection',
          'UNIVERSITY_SHORTLISTING': 'University Shortlisting',
          'APPLICATION_SUBMISSION': 'Application Submission',
          'OFFER_RECEIVED': 'Offer Received',
          'INITIAL_PAYMENT': 'Initial Payment',
          'INTERVIEW': 'Interview',
          'FINANCIAL_TB_TEST': 'Financial & TB Test',
          'CAS_VISA': 'CAS Process',
          'VISA_APPLICATION': 'Visa Process',
          'ENROLLMENT': 'Enrollment'
        };

        await Notification.create({
          userId: student.marketingOwnerId,
          type: 'application_progress',
          title: `Application Progress Updated: ${student.firstName} ${student.lastName}`,
          message: `${country ? `[${country}] ` : ''}Application progress has been updated from ${phaseLabels[previousPhase] || previousPhase.replace(/_/g, ' ')} to ${phaseLabels[currentPhase] || currentPhase.replace(/_/g, ' ')}.${remarks ? ` Remarks: ${remarks}` : ''}`,
          priority: 'medium',
          leadId: student.id,
          isRead: false,
          metadata: {
            previousPhase: previousPhase,
            newPhase: currentPhase,
            country: country || null,
            studentName: `${student.firstName} ${student.lastName}`,
            remarks: remarks || null
          }
        });
      } catch (notifError) {
        console.error('Error creating notification for marketing owner:', notifError);
        // Don't fail the request if notification creation fails
      }
    }

    // Clear dashboard cache to ensure stats update
    const cacheKey = `dashboard:${counselorId}`;
    await cacheUtils.del(cacheKey);
    
    // Reload country profile if it was updated
    if (countryProfile) {
      await countryProfile.reload();
    }
    
    res.json({
      message: country ? `Country phase updated successfully for ${country}` : 'Student phase updated successfully',
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        currentPhase: countryProfile ? countryProfile.currentPhase : student.currentPhase,
        status: student.status,
        updatedAt: student.updatedAt
      },
      country: country || null,
      countryProfile: countryProfile ? {
        id: countryProfile.id,
        country: countryProfile.country,
        currentPhase: countryProfile.currentPhase
      } : null
    });
  } catch (error) {
    console.error('Error updating student phase:', error);
    res.status(500).json({ 
      message: 'Error updating student phase',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 

// Get all tasks for the logged-in counselor
exports.getCounselorTasks = async (req, res) => {
  try {
    const counselorId = req.user?.id;
    if (!counselorId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found'
      });
    }
    const { search = '', sort = 'dueDate_asc', includeCompleted = 'false', page = 1, limit = 20 } = req.query;
    const where = { counselorId };
    if (includeCompleted === 'false') {
      where.completed = false;
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    let order = [['dueDate', 'ASC']];
    if (sort) {
      const [field, direction] = sort.split('_');
      order = [[field, direction.toUpperCase()]];
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Task.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });
    res.json({
      success: true,
      data: {
        tasks: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load tasks. Please try again later.'
    });
  }
}; 

// Get counselor profile
exports.getProfile = async (req, res) => {
  try {
    const counselorId = req.user.id;
    
    // Get basic user data
    const user = await User.findByPk(counselorId, {
      attributes: ['id', 'name', 'email', 'role', 'active', 'lastLogin', 'createdAt', 'phone', 'specialization', 'bio', 'location', 'experience', 'education', 'avatar', 'certifications', 'languages', 'preferences']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get counselor statistics
    const totalStudents = await Student.count({
      where: { counselorId }
    });

    const activeApplications = await StudentUniversityApplication.count({
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId }
      }],
      where: {
        applicationStatus: {
          [Op.notIn]: ['REJECTED', 'DEFERRED']
        }
      }
    });

    const successfulApplications = await StudentUniversityApplication.count({
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId }
      }],
      where: {
        applicationStatus: 'ACCEPTED'
      }
    });

    const profileData = {
      ...user.toJSON(),
      totalStudents,
      activeApplications,
      successfulApplications,
      // Add default values for optional fields
      phone: user.phone || '',
      specialization: user.specialization || '',
      bio: user.bio || '',
      location: user.location || '',
      experience: user.experience || '',
      education: user.education || '',
      avatar: user.avatar || null,
      certifications: user.certifications || [],
      languages: user.languages || [],
      preferences: user.preferences || {
        notifications: true,
        emailAlerts: true,
        theme: 'light'
      }
    };

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load profile data. Please try again later.'
    });
  }
};

// Update counselor profile
exports.updateProfile = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { name, phone, specialization, bio, location, experience, education } = req.body;

    // Find the user
    const user = await User.findByPk(counselorId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (specialization !== undefined) updateFields.specialization = specialization;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (experience !== undefined) updateFields.experience = experience;
    if (education !== undefined) updateFields.education = education;

    await user.update(updateFields);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        specialization: user.specialization,
        bio: user.bio,
        location: user.location,
        experience: user.experience,
        education: user.education
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again later.'
    });
  }
}; 

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    const counselorId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, and GIF images are allowed.'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }

    // Find the user
    const user = await User.findByPk(counselorId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `avatar_${counselorId}_${timestamp}.${fileExtension}`;
    
    // Create avatars directory if it doesn't exist
    const avatarsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    
    // Move file to avatars directory
    const newPath = path.join(avatarsDir, fileName);
    fs.renameSync(req.file.path, newPath);
    
    // Save file path to database
    const avatarPath = `/uploads/avatars/${fileName}`;
    await user.update({ avatar: avatarPath });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarPath
      }
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar. Please try again later.'
    });
  }
}; 

// Manual cache clearing for testing
exports.clearDashboardCache = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const cacheKey = `dashboard:${counselorId}`;
    
    await cacheUtils.del(cacheKey);
    res.json({
      success: true,
      message: 'Dashboard cache cleared successfully',
      counselorId
    });
  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing dashboard cache'
    });
  }
}; 

// Send email to student
exports.sendEmailToStudent = async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    const studentId = req.params.id;
    const counselorId = req.user.id;

    // Find the student and verify ownership
    const student = await Student.findOne({
      where: {
        id: studentId,
        counselorId
      }
    });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found or access denied' 
      });
    }

    // Validate email data
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const emailTo = to || student.email;
    if (!emailTo) {
      return res.status(400).json({
        success: false,
        message: 'No email address available for the student'
      });
    }

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Counselor CRM</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Message from your counselor</p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #1976d2; margin-top: 0;">${subject}</h3>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
            ${message}
          </div>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 14px; margin: 0;">
            This email was sent from your Counselor CRM account.<br>
            Please do not reply to this email. Contact your counselor directly if you have questions.
          </p>
        </div>
      </div>
    `;

    // Send the email
    const emailSent = await emailService.sendEmail(emailTo, subject, htmlContent);

    if (emailSent) {
      // Log the email activity
      await Activity.create({
        type: 'EMAIL_SENT',
        description: `Email sent to student: ${subject}`,
        studentId: studentId,
        userId: counselorId,
        metadata: {
          emailTo: emailTo,
          subject: subject,
          messageLength: message.length
        }
      });

      res.json({
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again.'
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending email'
    });
  }
};