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
  ApplicationCountry,
  PhaseMetadata,
  Message
} = require('../models');
const { Sequelize, Op } = require('sequelize');
const { createObjectCsvStringifier } = require('csv-writer');
const path = require('path');
const fs = require('fs');
const { cacheUtils } = require('../config/redis');
const websocketService = require('../services/websocketService');
const { performanceLogger, realTimeLogger } = require('../utils/logger');
const emailService = require('../services/emailService');
const { trackActivity } = require('../services/activityTracker');

// Country-specific document requirements mapping
// Maps country + phase label to required documents
const COUNTRY_DOCUMENT_REQUIREMENTS = {
  'usa': {
    'Offer Received': ['I_20_FORM'],
    'SEVIS Fee Payment': ['SEVIS_FEE_RECEIPT'],
    'Visa Application (F-1) – DS-160 + Biometrics': ['DS_160_CONFIRMATION', 'VISA_APPOINTMENT_CONFIRMATION', 'BANK_STATEMENTS', 'SPONSOR_AFFIDAVIT', 'INCOME_PROOF']
  },
  'uk': {
    'Visa Process': ['TB_TEST_CERTIFICATE', 'BANK_STATEMENTS', 'TUITION_FEE_RECEIPT']
  },
  'germany': {
    'Blocked Account + Health Insurance': ['BLOCKED_ACCOUNT_PROOF', 'HEALTH_INSURANCE'],
    'Visa Application – National D Visa': ['APS_CERTIFICATE', 'VISA_APPLICATION', 'BIOMETRICS']
  },
  'canada': {
    'Letter of Acceptance (LOA)': ['LOA'],
    'Initial Payment': ['TUITION_FEE_RECEIPT'],
    'Study Permit Application': ['GIC_CERTIFICATE', 'BANK_STATEMENTS', 'MEDICAL_EXAM', 'BIOMETRICS']
  },
  'australia': {
    'OSHC + Tuition Deposit': ['OSHC', 'TUITION_FEE_RECEIPT'],
    'eCOE Issued': ['ECOE'],
    'Visa Application (Subclass 500)': ['FINANCIAL_PROOF', 'VISA_APPLICATION', 'BIOMETRICS']
  },
  'ireland': {
    'Initial Tuition Payment': ['TUITION_FEE_RECEIPT'],
    'Visa Application': ['BANK_STATEMENT', 'MEDICAL_INSURANCE']
  },
  'france': {
    'Application Submission (Campus France / Direct)': ['CAMPUS_FRANCE_REGISTRATION', 'INTERVIEW_ACKNOWLEDGEMENT'],
    'Visa Application – VFS France': ['TUITION_FEE_RECEIPT', 'OFII_FORM', 'BIOMETRICS']
  },
  'italy': {
    'Pre-Enrollment on Universitaly Portal': ['UNIVERSITALY_RECEIPT'],
    'Visa Application – Type D (Long Stay)': ['FINANCIAL_PROOF', 'ACCOMMODATION_PROOF', 'VISA_APPLICATION']
  },
  'greece': {
    'Initial Tuition Payment': ['TUITION_FEE_RECEIPT'],
    'Visa Application (National Visa – Type D)': ['FINANCIAL_PROOF', 'ACCOMMODATION_PROOF', 'VISA_APPLICATION']
  },
  'denmark': {
    'Tuition Fee Payment': ['TUITION_FEE_RECEIPT'],
    'Residence Permit Application': ['FINANCIAL_PROOF', 'BIOMETRICS']
  },
  'finland': {
    'Tuition Fee Payment': ['TUITION_FEE_RECEIPT'],
    'Residence Permit Application': ['FINANCIAL_PROOF', 'BIOMETRICS']
  },
  'singapore': {
    'Student Pass Application (IPA)': ['IPA_LETTER'],
    'Student Pass Issuance': ['MEDICAL_REPORT']
  },
  'uae': {
    'Student Visa Processing': ['STUDENT_VISA_APPROVAL', 'MEDICAL_TEST', 'EMIRATES_ID_APPLICATION']
  },
  'malta': {
    'Initial Payment': ['TUITION_FEE_RECEIPT'],
    'Visa Application (National Visa – Type D)': ['BANK_STATEMENTS', 'ACCOMMODATION_PROOF', 'MEDICAL_INSURANCE']
  }
};

// Helper function to normalize country name to lowercase key
const normalizeCountryKey = (country) => {
  if (!country) return null;
  const normalized = country.trim();
  const upperNormalized = normalized.toUpperCase();

  const countryKeyMap = {
    'UK': 'uk', 'U.K.': 'uk', 'U.K': 'uk', 'UNITED KINGDOM': 'uk', 'United Kingdom': 'uk',
    'USA': 'usa', 'U.S.A.': 'usa', 'U.S.': 'usa', 'US': 'usa', 'UNITED STATES': 'usa', 'UNITED STATES OF AMERICA': 'usa', 'United States': 'usa',
    'UAE': 'uae', 'U.A.E.': 'uae', 'UNITED ARAB EMIRATES': 'uae', 'Dubai': 'uae', 'DUBAI': 'uae',
    'Germany': 'germany', 'GERMANY': 'germany',
    'Canada': 'canada', 'CANADA': 'canada',
    'Australia': 'australia', 'AUSTRALIA': 'australia',
    'Ireland': 'ireland', 'IRELAND': 'ireland',
    'France': 'france', 'FRANCE': 'france',
    'Italy': 'italy', 'ITALY': 'italy',
    'Greece': 'greece', 'GREECE': 'greece',
    'Denmark': 'denmark', 'DENMARK': 'denmark',
    'Finland': 'finland', 'FINLAND': 'finland',
    'Singapore': 'singapore', 'SINGAPORE': 'singapore',
    'Malta': 'malta', 'MALTA': 'malta'
  };

  return countryKeyMap[upperNormalized] || normalized.toLowerCase();
};

// Helper function to get country-specific document requirements for a phase
const getCountryPhaseDocuments = (country, phaseLabel) => {
  const countryKey = normalizeCountryKey(country);
  if (!countryKey || !COUNTRY_DOCUMENT_REQUIREMENTS[countryKey]) {
    return [];
  }
  return COUNTRY_DOCUMENT_REQUIREMENTS[countryKey][phaseLabel] || [];
};

// Helper function to get phase label from phase key (for country-specific phases)
const getPhaseLabel = async (phaseKey, country) => {
  try {
    const { CountryApplicationProcess } = require('../models');
    const countryProcess = await CountryApplicationProcess.findOne({
      where: { country, isActive: true }
    });

    if (countryProcess && countryProcess.applicationProcess && countryProcess.applicationProcess.steps) {
      const phase = countryProcess.applicationProcess.steps.find(p => {
        const pKey = typeof p === 'string' ? p : (p?.key || p);
        return pKey === phaseKey;
      });

      if (phase) {
        return typeof phase === 'string' ? phase : (phase?.label || phase?.key || phaseKey);
      }
    }
  } catch (err) {
  }

  // Fallback: return phase key with spaces
  return phaseKey.replace(/_/g, ' ');
};

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

    // Enrollment completed (per student, counted once even if multiple countries)
    // A student is considered "completed" if ANY country profile has reached ENROLLMENT
    // or has an enrollmentUniversity saved in notes (covers cases where they later reopen earlier phases).
    const completedEnrollments = await ApplicationCountry.count({
      distinct: true,
      col: 'studentId',
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId },
        attributes: []
      }],
      where: {
        [Op.or]: [
          { currentPhase: 'ENROLLMENT' },
          { notes: { [Op.like]: '%\"enrollmentUniversity\"%' } }
        ]
      }
    }) || 0;

    // Current students = students who have NOT completed Enrollment in any country (counted once per student)
    const currentStudents = Math.max(0, (totalStudents || 0) - (completedEnrollments || 0));

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
      tasks = [];
    }

    // Get phase distribution (global)
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
    }

    // Get country-specific phase distribution
    let countryProgress = [];
    try {
      // First, get all ApplicationCountry records with their students
      const countryData = await ApplicationCountry.findAll({
        include: [{
          model: Student,
          as: 'student',
          where: { counselorId },
          attributes: ['id']
        }],
        attributes: ['id', 'country', 'currentPhase']
      });

      // Group by country and then by ApplicationCountry's currentPhase
      const countryMap = {};
      countryData.forEach(item => {
        const country = item.country;
        const countryPhase = item.currentPhase; // Use ApplicationCountry's currentPhase, not Student's
        
        if (!country || !countryPhase) return; // Skip invalid entries

        if (!countryMap[country]) {
          countryMap[country] = {
            country: country,
            totalStudents: 0,
            phaseDistribution: {}
          };
        }

        countryMap[country].totalStudents += 1;
        
        // Count phases for this country using ApplicationCountry's currentPhase
        if (!countryMap[country].phaseDistribution[countryPhase]) {
          countryMap[country].phaseDistribution[countryPhase] = 0;
        }
        countryMap[country].phaseDistribution[countryPhase] += 1;
      });

      // Convert phaseDistribution object to array format
      Object.keys(countryMap).forEach(country => {
        countryMap[country].phaseDistribution = Object.entries(countryMap[country].phaseDistribution).map(([phase, count]) => ({
          phase: phase,
          count: count
        }));
      });

      // Convert to array and calculate percentages
      countryProgress = Object.values(countryMap).map(countryData => {
        const total = countryData.totalStudents;
        return {
          country: countryData.country,
          totalStudents: total,
          phaseDistribution: countryData.phaseDistribution.map(phaseData => ({
            phase: phaseData.phase,
            count: phaseData.count,
            percentage: total > 0 ? Math.round((phaseData.count / total) * 100) : 0
          }))
        };
      });
    } catch (error) {
      console.error('Error fetching country progress:', error);
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
    }

    const dashboardData = {
      stats: {
        totalStudents: totalStudents || 0,
        activeApplications: activeApplications || 0,
        pendingDocuments,
        upcomingDeadlines,
        completedEnrollments,
        currentStudents
      },
      recentStudents: recentStudents || [],
      upcomingTasks: tasks,
      phaseDistribution: phaseDistribution || [],
      universityDistribution: universityDistribution || [],
      countryProgress: countryProgress || []
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
      // Do not fail main request on cache issues
    }

    // If this lead originated from telecaller imported tasks, mark those records as assigned
    // and sync interestedCountry to targetCountries
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

        // Find the imported task to get interestedCountry
        const importedTasks = await TelecallerImportedTask.findAll({ where });

        // Update lead status
        await TelecallerImportedTask.update(
          { leadStatus: 'ASSIGNED_TO_COUNSELOR' },
          { where }
        );

        // Sync interestedCountry to targetCountries if targetCountries is empty
        if (importedTasks.length > 0) {
          const importedTask = importedTasks[0]; // Use the first matching task
          if (importedTask.interestedCountry && !student.targetCountries) {
            const targetCountries = importedTask.interestedCountry.trim();
            await student.update({ targetCountries });

            // Auto-create country profiles from interestedCountry
            try {
              const countries = targetCountries
                .split(',')
                .map(c => c.trim())
                .filter(c => c.length > 0);

              for (const country of countries) {
                try {
                  // Check if profile already exists
                  const existing = await ApplicationCountry.findOne({
                    where: { studentId: student.id, country }
                  });

                  if (!existing) {
                    await ApplicationCountry.create({
                      studentId: student.id,
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
                      notes: `Country profile auto-created from telecaller lead interested country: ${country}. Application progress starts from beginning.`
                    });
                  }
                } catch (error) {
                  // Log but don't fail - country profile creation is not critical
                }
              }
            } catch (error) {
              // Do not fail the main request if this background update fails
            }
          }
        }
      }
    } catch (importedUpdateError) {
      // Do not fail the main request if this background update fails
    }

    return res.json({
      success: true,
      message: 'Lead assignment accepted successfully'
    });
  } catch (error) {
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
    const { search, phase, sort, enrollmentStatus = 'ALL', page = 1, limit = 10 } = req.query;

    // Build cache key based on query parameters
    const cacheKey = `students:${counselorId}:${search || 'all'}:${phase || 'all'}:${enrollmentStatus || 'all'}:${sort || 'default'}:${page}:${limit}`;

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

    // Enrollment completion filter:
    // COMPLETED = student has enrollment in at least one country
    // CURRENT   = student has not enrolled in any country
    // IMPORTANT: Don't hardcode table name; environments may use different casing/pluralization.
    // Use the model's resolved table name for correlated subquery.
    const applicationCountryTableName = (() => {
      try {
        const tn = ApplicationCountry.getTableName();
        if (typeof tn === 'string') return tn;
        if (tn && typeof tn === 'object' && tn.tableName) return tn.tableName;
      } catch (e) {
        // ignore
      }
      // Fallbacks seen in existing scripts
      return 'ApplicationCountries';
    })();

    const enrollmentExistsSql =
      `EXISTS (SELECT 1 FROM ${applicationCountryTableName} ac ` +
      `WHERE ac.studentId = Student.id AND (` +
      `ac.currentPhase = 'ENROLLMENT' OR ac.notes LIKE '%\"enrollmentUniversity\"%'` +
      `))`;

    if (enrollmentStatus === 'COMPLETED') {
      where[Op.and] = [...(where[Op.and] || []), Sequelize.literal(enrollmentExistsSql)];
    } else if (enrollmentStatus === 'CURRENT') {
      where[Op.and] = [...(where[Op.and] || []), Sequelize.literal(`NOT ${enrollmentExistsSql}`)];
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

    // Get Message table name
    const messageTableName = (() => {
      try {
        const tn = Message.getTableName();
        if (typeof tn === 'string') return tn;
        if (tn && typeof tn === 'object' && tn.tableName) return tn.tableName;
      } catch (e) {
        // ignore
      }
      return 'Messages';
    })();

    // Subquery to count unread messages from marketing to counselor for each student
    const unreadMessageCountSql =
      `(SELECT COUNT(*) FROM ${messageTableName} m ` +
      `WHERE m.studentId = Student.id ` +
      `AND m.receiverId = ${counselorId} ` +
      `AND m.isRead = false)`;

    const { count, rows } = await Student.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      attributes: {
        include: [
          [Sequelize.literal(enrollmentExistsSql), 'hasEnrollmentCompleted'],
          [Sequelize.literal(unreadMessageCountSql), 'unreadMessageCount']
        ]
      },
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

    // Normalize computed attributes
    const students = (rows || []).map(row => {
      const json = row.toJSON ? row.toJSON() : row;
      const raw = json?.hasEnrollmentCompleted;
      json.hasEnrollmentCompleted = raw === true || raw === 1 || raw === '1' || raw === 'true' || Number(raw) === 1;
      // Normalize unread message count to integer
      const unreadCount = json?.unreadMessageCount;
      json.unreadMessageCount = unreadCount ? parseInt(unreadCount, 10) : 0;
      return json;
    });

    const result = {
      success: true,
      message: 'Students fetched successfully',
      data: {
        students,
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
    res.status(500).json({
      message: 'Error fetching students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to clean country name (remove brackets/quotes, trim)
function cleanCountryName(country) {
  if (!country) return '';
  return country
    .replace(/[\[\]"]/g, '')
    .trim();
}

// Helper to normalize for deduplication
function normalizeCountryForDedup(country) {
  if (!country) return '';
  const cleaned = cleanCountryName(country);
  const normalized = cleaned.toUpperCase();

  if (['UK', 'U.K.', 'U.K', 'UNITED KINGDOM'].includes(normalized)) {
    return 'UNITED KINGDOM';
  }
  if (['USA', 'U.S.A.', 'US', 'U.S.', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(normalized)) {
    return 'UNITED STATES';
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

// Helper function to auto-create country profiles from targetCountries
async function autoCreateCountryProfilesFromTargetCountries(studentId, targetCountries) {
  if (!targetCountries) return;

  let countries = [];

  try {
    if (Array.isArray(targetCountries)) {
      countries = targetCountries;
    } else if (typeof targetCountries === 'string') {
      const raw = targetCountries.trim();
      if (raw.startsWith('[')) {
        // JSON array string
        countries = JSON.parse(raw);
      } else {
        // Comma-separated string
        countries = raw.split(',').map(c => c.trim()).filter(Boolean);
      }
    }
  } catch (e) {
    countries = [];
  }

  if (!countries || countries.length === 0) return;

  const seenNormalized = new Set();

  // Create country profiles for each unique, cleaned country
  for (const rawCountry of countries) {
    const cleaned = cleanCountryName(rawCountry);
    const normalizedKey = normalizeCountryForDedup(cleaned);

    if (!normalizedKey || seenNormalized.has(normalizedKey)) continue;
    seenNormalized.add(normalizedKey);

    try {
      // Check if profile already exists
      const existing = await ApplicationCountry.findOne({
        where: { studentId, country: cleaned }
      });

      if (!existing) {
        await ApplicationCountry.create({
          studentId,
          country: cleaned,
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

    await trackActivity(req.user.id, 'STUDENT_CREATE', `Added new student: ${student.firstName} ${student.lastName}`, {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`
    });

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
    const counselorId = req.user.id;

    // Get Message table name
    const messageTableName = (() => {
      try {
        const tn = Message.getTableName();
        if (typeof tn === 'string') return tn;
        if (tn && typeof tn === 'object' && tn.tableName) return tn.tableName;
      } catch (e) {
        // ignore
      }
      return 'Messages';
    })();

    // Subquery to count unread messages from marketing to counselor for this student
    const unreadMessageCountSql =
      `(SELECT COUNT(*) FROM ${messageTableName} m ` +
      `WHERE m.studentId = Student.id ` +
      `AND m.receiverId = ${counselorId} ` +
      `AND m.isRead = false)`;

    const student = await Student.findOne({
      where: {
        id: req.params.id,
        counselorId: req.user.id
      },
      attributes: {
        include: [
          [Sequelize.literal(unreadMessageCountSql), 'unreadMessageCount']
        ]
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

    // If targetCountries is empty and student came from telecaller, try to sync from TelecallerImportedTask
    if (!student.targetCountries && student.marketingOwnerId) {
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
          const importedTask = await TelecallerImportedTask.findOne({ where });

          if (importedTask && importedTask.interestedCountry) {
            const targetCountries = importedTask.interestedCountry.trim();
            await student.update({ targetCountries });
            // Reload student to get updated targetCountries
            await student.reload();
          }
        }
      } catch (syncError) {
        // Do not fail the request if sync fails
      }
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

    // Normalize unread message count to integer
    const studentJson = student.toJSON ? student.toJSON() : student;
    const unreadCount = studentJson?.unreadMessageCount;
    studentJson.unreadMessageCount = unreadCount ? parseInt(unreadCount, 10) : 0;

    res.json({
      success: true,
      message: 'Student details fetched successfully',
      data: studentJson
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
        // Enrollment phase: universal docs required for ALL countries
        'ENROLLMENT': ['ID_CARD', 'ENROLLMENT_LETTER']
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

          const marketingNotification = await Notification.create({
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
              studentName: `${student.firstName} ${student.lastName}`,
              country: null
            }
          });

          try {
            await websocketService.sendNotification(student.marketingOwnerId, marketingNotification.toJSON());
          } catch (wsErr) {
          }
        } catch (notifError) {
          // Don't fail the request if notification creation fails
        }
      }

      // Notify telecaller who imported this lead (if any)
      try {
        const orConditions = [];
        if (student.email) {
          orConditions.push({ emailId: student.email });
        }
        if (student.phone) {
          orConditions.push({ contactNumber: student.phone });
        }
        if (orConditions.length) {
          const telecallerLead = await TelecallerImportedTask.findOne({
            where: {
              [Op.or]: orConditions
            }
          });

          if (telecallerLead?.telecallerId) {
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

            const telecallerNotification = await Notification.create({
              userId: telecallerLead.telecallerId,
              type: 'application_progress',
              title: `Application Progress Updated: ${student.firstName} ${student.lastName}`,
              message: `Application progress has been updated from ${phaseLabels[student.currentPhase] || student.currentPhase.replace(/_/g, ' ')} to ${phaseLabels[req.body.currentPhase] || req.body.currentPhase.replace(/_/g, ' ')}.`,
              priority: 'medium',
              leadId: student.id,
              isRead: false,
              metadata: {
                previousPhase: student.currentPhase,
                newPhase: req.body.currentPhase,
                studentName: `${student.firstName} ${student.lastName}`,
                country: null
              }
            });

            try {
              await websocketService.sendNotification(telecallerLead.telecallerId, telecallerNotification.toJSON());
            } catch (wsErr) {
            }
          }
        }
      } catch (teleNotifErr) {
      }
    }

    // Clear dashboard cache to ensure stats update
    const cacheKey = `dashboard:${req.user.id}`;
    await cacheUtils.del(cacheKey);

    // Track activity
    if (req.body.currentPhase && req.body.currentPhase !== student.currentPhase) {
      await trackActivity(req.user.id, 'PHASE_CHANGE', `Changed phase for ${student.firstName} ${student.lastName} to ${req.body.currentPhase}`, {
        studentId: student.id,
        oldPhase: student.currentPhase, // access from closure or verify student obj is not updated in place? sequelize updates instance.
        newPhase: req.body.currentPhase
      });
    } else {
      await trackActivity(req.user.id, 'STUDENT_EDIT', `Updated details for student: ${student.firstName} ${student.lastName}`, {
        studentId: student.id
      });
    }

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
    console.error('  Error creating document:', error);
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
      country,
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
          where: country ? (() => {
            // Normalize country names for filtering (handle UK = United Kingdom, etc.)
            const normalizeCountry = (c) => {
              if (!c) return '';
              const upper = c.trim().toUpperCase();
              if (upper === 'UK' || upper === 'U.K.' || upper === 'U.K' || upper === 'UNITED KINGDOM') {
                return ['United Kingdom', 'UK', 'U.K.', 'U.K'];
              }
              if (upper === 'USA' || upper === 'U.S.A.' || upper === 'US' || upper === 'U.S.' || upper === 'UNITED STATES' || upper === 'UNITED STATES OF AMERICA') {
                return ['United States', 'USA', 'U.S.A.', 'US', 'U.S.', 'United States of America'];
              }
              return [c];
            };
            const countryVariations = normalizeCountry(country);
            return countryVariations.length > 1 ? { [Op.in]: countryVariations } : { country: countryVariations[0] };
          })() : undefined,
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


    if (!studentId || !country) {
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
    res.status(500).json({ message: 'Error exporting applications' });
  }
};

// Helper function to get or create phase metadata
const getOrCreatePhaseMetadata = async (studentId, country, phaseName, defaultStatus = 'Pending') => {
  try {
    const [phaseMetadata, created] = await PhaseMetadata.findOrCreate({
      where: {
        studentId,
        country,
        phaseName
      },
      defaults: {
        studentId,
        country,
        phaseName,
        status: defaultStatus,
        reopenCount: 0,
        maxReopenAllowed: 2,
        finalEditAllowed: true
      }
    });
    return phaseMetadata;
  } catch (error) {
    // If table doesn't exist, return a mock object that won't cause errors
    if (error.name === 'SequelizeDatabaseError' || error.message?.includes('doesn\'t exist')) {
      return {
        status: defaultStatus,
        reopenCount: 0,
        maxReopenAllowed: 2,
        finalEditAllowed: true,
        update: async () => { }, // No-op update function
        reload: async () => { }
      };
    }
    throw error;
  }
};

// Helper function to update phase metadata status
const updatePhaseMetadataStatus = async (studentId, country, phaseName, newStatus) => {
  try {
    const phaseMetadata = await getOrCreatePhaseMetadata(studentId, country, phaseName, newStatus);
    if (phaseMetadata.update) {
      await phaseMetadata.update({ status: newStatus });
    }
    return phaseMetadata;
  } catch (error) {
    // If table doesn't exist, just return silently
    if (error.name === 'SequelizeDatabaseError' || error.message?.includes('doesn\'t exist')) {
      return null;
    }
    throw error;
  }
};

// Helper function to check if phase is locked
const isPhaseLocked = async (studentId, country, phaseName) => {
  try {
    const phaseMetadata = await PhaseMetadata.findOne({
      where: {
        studentId,
        country,
        phaseName
      }
    });

    if (!phaseMetadata) {
      return false; // Phase not locked if metadata doesn't exist
    }

    return phaseMetadata.status === 'Locked' || !phaseMetadata.finalEditAllowed;
  } catch (error) {
    // If table doesn't exist, phase is not locked
    if (error.name === 'SequelizeDatabaseError' || error.message?.includes('doesn\'t exist')) {
      return false;
    }
    throw error;
  }
};

// Reopen a phase (backward movement)
exports.reopenPhase = async (req, res) => {
  try {
    const { id } = req.params; // studentId
    const { phaseName, country } = req.body;
    const counselorId = req.user.id;

    if (!phaseName) {
      return res.status(400).json({ message: 'Phase name is required' });
    }

    if (!country) {
      return res.status(400).json({ message: 'Country is required for phase reopening' });
    }

    // Find student
    const student = await Student.findOne({
      where: {
        id,
        counselorId
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find country profile
    const countryProfile = await ApplicationCountry.findOne({
      where: { studentId: id, country }
    });

    if (!countryProfile) {
      return res.status(404).json({
        message: `Country profile for ${country} not found.`
      });
    }

    // Get current phase metadata (gracefully handle if table doesn't exist)
    let phaseMetadata;
    let canUseMetadata = true;
    try {
      phaseMetadata = await getOrCreatePhaseMetadata(id, country, phaseName, 'Completed');

      // Check if we got a real metadata object (not a mock)
      if (!phaseMetadata || !phaseMetadata.update || typeof phaseMetadata.update !== 'function') {
        canUseMetadata = false;
      }
    } catch (metadataError) {
      canUseMetadata = false;
    }

    // Check if phase is already locked (only if metadata is available)
    if (canUseMetadata && phaseMetadata) {
      if (phaseMetadata.status === 'Locked') {
        return res.status(400).json({
          message: 'This phase is permanently locked. Maximum updates reached.',
          phaseName,
          status: 'Locked'
        });
      }

      // Check if phase can be reopened
      if (phaseMetadata.reopenCount >= phaseMetadata.maxReopenAllowed) {
        // Lock the phase permanently
        try {
          await phaseMetadata.update({
            status: 'Locked',
            finalEditAllowed: false
          });
        } catch (updateError) {
        }

        return res.status(400).json({
          message: 'Maximum reopen attempts reached. This phase is now permanently locked.',
          phaseName,
          status: 'Locked',
          reopenCount: phaseMetadata.reopenCount,
          maxReopenAllowed: phaseMetadata.maxReopenAllowed
        });
      }
    }

    // Get phases for the country to determine phase order
    // Try to get from CountryApplicationProcess, otherwise use default phases
    let phases = [];
    try {
      const { CountryApplicationProcess } = require('../models');
      const countryProcess = await CountryApplicationProcess.findOne({
        where: { country, isActive: true }
      });

      if (countryProcess && countryProcess.applicationProcess) {
        phases = countryProcess.applicationProcess.steps || [];
      }
    } catch (err) {
    }

    // Normalize phases to ensure they all have a 'key' property
    // Handle both string arrays and object arrays
    let normalizedPhases = phases.map(p => {
      if (typeof p === 'string') {
        return { key: p };
      }
      return p && p.key ? p : { key: p };
    });

    // Fallback to default phases if none found - but also check if we can find the phase in metadata
    // This handles country-specific phases that might not be in the default list
    if (normalizedPhases.length === 0) {
      // Try to get all phases from metadata for this country to build a comprehensive list
      try {
        const allMetadata = await PhaseMetadata.findAll({
          where: { studentId: id, country },
          attributes: ['phaseName'],
          group: ['phaseName']
        });

        // If we have metadata, use those phases (but we still need order, so use default as base)
        if (allMetadata && allMetadata.length > 0) {
          const metadataPhases = allMetadata.map(m => ({ key: m.phaseName }));
          // Merge with default phases, ensuring all metadata phases are included
          const defaultPhases = [
            { key: 'DOCUMENT_COLLECTION', label: 'Document Collection' },
            { key: 'UNIVERSITY_SHORTLISTING', label: 'University Shortlisting' },
            { key: 'APPLICATION_SUBMISSION', label: 'Application Submission' },
            { key: 'OFFER_RECEIVED', label: 'Offer Received' },
            { key: 'INITIAL_PAYMENT', label: 'Initial Payment' },
            { key: 'INTERVIEW', label: 'Interview' },
            { key: 'FINANCIAL_TB_TEST', label: 'Financial & TB Test' },
            { key: 'CAS_VISA', label: 'CAS Process' },
            { key: 'VISA_APPLICATION', label: 'Visa Process' },
            { key: 'VISA_DECISION', label: 'Visa Decision' },
            { key: 'ENROLLMENT', label: 'Enrollment' }
          ];

          // Combine default phases with metadata phases, avoiding duplicates
          const phaseKeys = new Set(defaultPhases.map(p => p.key));
          metadataPhases.forEach(mp => {
            if (!phaseKeys.has(mp.key)) {
              defaultPhases.push(mp);
              phaseKeys.add(mp.key);
            }
          });
          normalizedPhases = defaultPhases;
        } else {
          // No metadata, use default phases including VISA_DECISION
          normalizedPhases = [
            { key: 'DOCUMENT_COLLECTION', label: 'Document Collection' },
            { key: 'UNIVERSITY_SHORTLISTING', label: 'University Shortlisting' },
            { key: 'APPLICATION_SUBMISSION', label: 'Application Submission' },
            { key: 'OFFER_RECEIVED', label: 'Offer Received' },
            { key: 'INITIAL_PAYMENT', label: 'Initial Payment' },
            { key: 'INTERVIEW', label: 'Interview' },
            { key: 'FINANCIAL_TB_TEST', label: 'Financial & TB Test' },
            { key: 'CAS_VISA', label: 'CAS Process' },
            { key: 'VISA_APPLICATION', label: 'Visa Process' },
            { key: 'VISA_DECISION', label: 'Visa Decision' },
            { key: 'ENROLLMENT', label: 'Enrollment' }
          ];
        }
      } catch (metadataErr) {
        // Fallback to default phases including VISA_DECISION
        normalizedPhases = [
          { key: 'DOCUMENT_COLLECTION', label: 'Document Collection' },
          { key: 'UNIVERSITY_SHORTLISTING', label: 'University Shortlisting' },
          { key: 'APPLICATION_SUBMISSION', label: 'Application Submission' },
          { key: 'OFFER_RECEIVED', label: 'Offer Received' },
          { key: 'INITIAL_PAYMENT', label: 'Initial Payment' },
          { key: 'INTERVIEW', label: 'Interview' },
          { key: 'FINANCIAL_TB_TEST', label: 'Financial & TB Test' },
          { key: 'CAS_VISA', label: 'CAS Process' },
          { key: 'VISA_APPLICATION', label: 'Visa Process' },
          { key: 'VISA_DECISION', label: 'Visa Decision' },
          { key: 'ENROLLMENT', label: 'Enrollment' }
        ];
      }
    } else {
      // We have phases from CountryApplicationProcess, but ensure VISA_DECISION is included if it exists in metadata
      const hasVisaDecision = normalizedPhases.some(p => p.key === 'VISA_DECISION' || p.key?.includes('VISA_DECISION'));
      if (!hasVisaDecision) {
        // Check if VISA_DECISION exists in metadata for this country
        try {
          const visaDecisionMeta = await PhaseMetadata.findOne({
            where: { studentId: id, country, phaseName: 'VISA_DECISION' }
          });
          if (visaDecisionMeta) {
            // Add VISA_DECISION to the phases list (insert before ENROLLMENT if it exists)
            const enrollmentIndex = normalizedPhases.findIndex(p => p.key === 'ENROLLMENT');
            if (enrollmentIndex !== -1) {
              normalizedPhases.splice(enrollmentIndex, 0, { key: 'VISA_DECISION', label: 'Visa Decision' });
            } else {
              normalizedPhases.push({ key: 'VISA_DECISION', label: 'Visa Decision' });
            }
          }
        } catch (metaErr) {
          // Ignore metadata errors, continue with existing phases
        }
      }
    }

    // First, check if the target phase exists in metadata (this handles country-specific phases like VISA_DECISION)
    let targetPhaseMeta = null;
    try {
      targetPhaseMeta = await PhaseMetadata.findOne({
        where: { studentId: id, country, phaseName }
      });
    } catch (metaErr) {
    }

    const currentPhaseIndex = normalizedPhases.findIndex(p => p.key === countryProfile.currentPhase);
    const targetPhaseIndex = normalizedPhases.findIndex(p => p.key === phaseName);

    // Log for debugging

    // Validate that we're going backward
    // Strategy: Be very lenient - if phase exists in metadata OR is a known phase pattern, allow reopening
    // Only reject if we can definitively determine it's invalid

    // If target phase is not in the phase list, check metadata
    if (targetPhaseIndex === -1) {
      if (targetPhaseMeta) {
        // Phase exists in metadata - check if it's completed, current, or locked
        // Allow reopening if status is Completed or Current (Current means it was reopened before)
        // Locked status is already checked earlier in the function
        if (targetPhaseMeta.status === 'Pending') {
          return res.status(400).json({
            message: `Phase ${phaseName} has not been started yet. Cannot reopen a phase that hasn't been completed.`
          });
        }

        // Allow reopening if phase is Completed or Current (Current means it was reopened before)
      } else {
        // Phase doesn't exist in metadata - this could mean:
        // 1. Phase was never completed (shouldn't be able to reopen)
        // 2. Metadata table doesn't exist or wasn't initialized
        // 3. Phase is a valid country-specific phase that just hasn't been tracked yet

        // Be lenient: Allow reopening if it's a known phase pattern or if current phase is also not in list
        // This handles cases where both phases are country-specific
        const knownPhasePatterns = ['VISA_DECISION', 'VISA_APPLICATION', 'OFFER', 'ECOE', 'OSHC', 'PRE_DEPARTURE', 'TUITION', 'DEPOSIT'];
        const isKnownPhase = knownPhasePatterns.some(pattern => phaseName.toUpperCase().includes(pattern));

        if (isKnownPhase || currentPhaseIndex === -1) {
          // Known phase pattern or both phases are country-specific - allow reopening
        } else {
          // Unknown phase and current phase is in list - this is suspicious, but still allow for flexibility
        }
      }
    } else {
      // Target phase is in the list - validate backward movement using indices
      if (currentPhaseIndex === -1) {
        // Current phase is not in list but target is
        // This means current phase is country-specific, allow reopening target if it's in the list
        // Check metadata to see if target is completed or current
        if (targetPhaseMeta) {
          if (targetPhaseMeta.status === 'Pending') {
            return res.status(400).json({
              message: `Phase ${phaseName} has not been started yet. Cannot reopen a phase that hasn't been completed.`
            });
          }
        } else {
        }
      } else if (targetPhaseIndex >= currentPhaseIndex) {
        // Both phases are in list - validate backward movement
        return res.status(400).json({
          message: 'Can only reopen previous phases. Use phase update to move forward.'
        });
      }
      // targetPhaseIndex < currentPhaseIndex - valid backward movement
    }

    // Update country profile current phase FIRST (this is the critical update)
    await countryProfile.update({
      currentPhase: phaseName,
      lastUpdated: new Date()
    });

    // Update phase metadata if available
    let newReopenCount = 0;
    let isFinalEdit = false;
    if (canUseMetadata && phaseMetadata && phaseMetadata.update) {
      try {
        // Increment reopen count
        newReopenCount = (phaseMetadata.reopenCount || 0) + 1;
        const maxReopen = phaseMetadata.maxReopenAllowed || 2;
        isFinalEdit = newReopenCount > maxReopen; // After maxReopenAllowed (2), the next completion will lock

        // Update phase metadata
        await phaseMetadata.update({
          status: 'Current',
          reopenCount: newReopenCount,
          finalEditAllowed: !isFinalEdit // After exceeding maxReopenAllowed, this is the final edit
        });

        // Reset all phases after the reopened phase to Pending
        const phasesToReset = normalizedPhases.slice(targetPhaseIndex + 1);
        for (const phase of phasesToReset) {
          const phaseKey = typeof phase === 'string' ? phase : (phase?.key || phase);
          if (phaseKey) {
            try {
              await updatePhaseMetadataStatus(id, country, phaseKey, 'Pending');
            } catch (resetError) {
            }
          }
        }

        // Reload phase metadata
        try {
          await phaseMetadata.reload();
        } catch (reloadError) {
        }
      } catch (metadataUpdateError) {
        // Phase was already updated in country profile, so continue
      }
    } else {
      // If metadata not available, still reset phases (gracefully)
      try {
        const phasesToReset = normalizedPhases.slice(targetPhaseIndex + 1);
        for (const phase of phasesToReset) {
          const phaseKey = typeof phase === 'string' ? phase : (phase?.key || phase);
          if (phaseKey) {
            await updatePhaseMetadataStatus(id, country, phaseKey, 'Pending');
          }
        }
      } catch (resetError) {
      }
    }

    // Create activity log
    try {
      await Activity.create({
        type: 'PHASE_REOPEN',
        description: `Phase ${phaseName.replace(/_/g, ' ')} reopened for ${country}.${canUseMetadata ? ` Reopen count: ${newReopenCount}/${phaseMetadata?.maxReopenAllowed || 2 + 1}` : ''}`,
        studentId: id,
        userId: counselorId,
        metadata: {
          phaseName,
          country,
          reopenCount: newReopenCount,
          maxReopenAllowed: phaseMetadata?.maxReopenAllowed || 2,
          isFinalEdit
        }
      });
    } catch (activityError) {
      // Don't fail the request if activity log fails
    }

    // Reload country profile to get updated currentPhase
    await countryProfile.reload();

    res.json({
      message: `Phase ${phaseName.replace(/_/g, ' ')} reopened successfully. You can now edit this phase.`,
      phaseMetadata: canUseMetadata && phaseMetadata ? {
        phaseName: phaseMetadata.phaseName || phaseName,
        status: phaseMetadata.status || 'Current',
        reopenCount: phaseMetadata.reopenCount || newReopenCount,
        maxReopenAllowed: phaseMetadata.maxReopenAllowed || 2,
        finalEditAllowed: phaseMetadata.finalEditAllowed !== undefined ? phaseMetadata.finalEditAllowed : true,
        editsLeft: Math.max(0, (phaseMetadata.maxReopenAllowed || 2) + 1 - (phaseMetadata.reopenCount || newReopenCount))
      } : null,
      countryProfile: {
        id: countryProfile.id,
        country: countryProfile.country,
        currentPhase: countryProfile.currentPhase // This should now be the reopened phase
      },
      phaseEnabled: true // Flag to indicate phase is now editable
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error reopening phase',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get phase metadata for a student/country
exports.getPhaseMetadata = async (req, res) => {
  try {
    const { id } = req.params; // studentId
    const { country } = req.query;
    const counselorId = req.user.id;

    // Find student - allow access if student exists and user is a counselor
    // This allows counselors to view phase metadata for marketing leads or shared students
    const student = await Student.findOne({
      where: {
        id
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify user has access: either assigned counselor, or user is a counselor (for viewing metadata)
    const hasAccess = 
      student.counselorId === counselorId || 
      req.user.role === 'counselor' ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!country) {
      return res.status(400).json({ message: 'Country parameter is required' });
    }

    // Get all phase metadata for this student and country
    // If no metadata exists, return empty array (this is normal for new students)
    let phaseMetadata = [];
    try {
      phaseMetadata = await PhaseMetadata.findAll({
        where: {
          studentId: id,
          country
        }
      });
    } catch (dbError) {
      // If table doesn't exist yet, return empty array
      if (dbError.name === 'SequelizeDatabaseError' || dbError.message?.includes('doesn\'t exist')) {
        return res.json({ phaseMetadata: [] });
      }
      throw dbError;
    }

    res.json({
      phaseMetadata: phaseMetadata.map(pm => ({
        phaseName: pm.phaseName,
        status: pm.status,
        reopenCount: pm.reopenCount,
        maxReopenAllowed: pm.maxReopenAllowed,
        finalEditAllowed: pm.finalEditAllowed,
        editsLeft: Math.max(0, pm.maxReopenAllowed + 1 - pm.reopenCount)
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error getting phase metadata',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    // For global (non-country-specific) phases, enforce a strict whitelist.
    // For country-specific phases (when `country` is provided), allow any phase key
    // coming from the country process configuration (e.g., OFFER_LETTER_AUSTRALIA, LETTER_OF_ACCEPTANCE, etc.).
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

    if (!country && !validPhases.includes(currentPhase)) {
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
        // Australia Offer Letter phase no longer enforces any specific documents
        'OFFER_LETTER_AUSTRALIA': [],
        'INITIAL_PAYMENT': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
        'INTERVIEW': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
        'FINANCIAL_TB_TEST': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'CAS_VISA': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        'VISA_APPLICATION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
        // Enrollment phase: universal docs required for ALL countries
        'ENROLLMENT': ['ID_CARD', 'ENROLLMENT_LETTER']
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
        'MEDICAL_CERTIFICATE': 'Medical examination certificate and TB test results',
        'ID_CARD': 'Student ID card (front and back if applicable)',
        'ENROLLMENT_LETTER': 'Official enrollment/registration letter from the institution',
        'OFFER_LETTER': 'Official offer letter issued by the university for this application'
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
        'ENROLLMENT': 'Final enrollment requires student ID card and enrollment letter.'
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

      // Get required documents - check country-specific first, then fallback to generic
      let requiredDocs = [];
      let phaseLabel = newPhase.replace(/_/g, ' ');

      // If country is provided, check for country-specific document requirements
      if (country) {
        phaseLabel = await getPhaseLabel(newPhase, country);
        const countrySpecificDocs = getCountryPhaseDocuments(country, phaseLabel);

        if (countrySpecificDocs.length > 0) {
          requiredDocs = countrySpecificDocs;
        } else {
          // Fallback to generic phase requirements
          requiredDocs = phaseRequirements[newPhase] || [];
        }
      } else {
        // No country provided, use generic phase requirements
        requiredDocs = phaseRequirements[newPhase] || [];
      }

      // Shared documents that are valid across all countries
      const SHARED_DOCUMENTS = [
        'FINANCIAL_PROOF',
        'FINANCIAL_STATEMENT',
        'BANK_STATEMENT',
        'BANK_STATEMENTS',
        'PASSPORT',
        'ACADEMIC_TRANSCRIPT',
        'ENGLISH_TEST_SCORE',
        'MEDICAL_CERTIFICATE',
        'CV_RESUME',
        'RECOMMENDATION_LETTER',
        'STATEMENT_OF_PURPOSE'
      ];

      // Validate required documents if any
      if (requiredDocs.length > 0) {
        // Get all uploaded documents (including shared ones)
        const uploadedDocs = await Document.findAll({
          where: {
            studentId: id,
            status: ['PENDING', 'APPROVED']
          }
        });

        // Filter to include required documents
        // Since documents don't have a country field, ALL documents for the student are checked
        // This means FINANCIAL_PROOF uploaded for one country will be recognized for all countries
        const relevantDocs = uploadedDocs.filter(doc => {
          // Simple check: if this document type is in the required documents list, include it
          // This automatically handles shared documents like FINANCIAL_PROOF across all countries
          return requiredDocs.includes(doc.type);
        });

        const uploadedDocTypes = relevantDocs.map(doc => doc.type);
        // For shared documents, check if any uploaded shared document satisfies the requirement
        const missingDocs = requiredDocs.filter(docType => {
          // If it's a shared document, check if any shared document of that type exists
          if (SHARED_DOCUMENTS.includes(docType)) {
            return !uploadedDocTypes.includes(docType);
          }
          // For non-shared documents, require exact match
          return !uploadedDocTypes.includes(docType);
        });

        if (missingDocs.length > 0) {
          // Create detailed missing documents list
          const missingDocsList = missingDocs.map(docType =>
            `• ${docType.replace(/_/g, ' ')}: ${documentDescriptions[docType] || 'Required document'}`
          ).join('\n');

          // Create comprehensive error message
          const phaseDescription = phaseDescriptions[newPhase] || (country ? `Required documents for ${country} ${phaseLabel} phase` : '');

          const detailedMessage = `Cannot proceed to ${phaseLabel} phase${country ? ` (${country})` : ''}

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
            phaseName: phaseLabel,
            phaseDescription: phaseDescription,
            country: country || null,
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

      // Check if the target phase is locked (gracefully handle if table doesn't exist)
      try {
        const targetPhaseLocked = await isPhaseLocked(id, country, currentPhase);
        if (targetPhaseLocked) {
          return res.status(400).json({
            message: `Cannot move to ${currentPhase.replace(/_/g, ' ')} phase. This phase is permanently locked.`,
            phaseName: currentPhase,
            status: 'Locked'
          });
        }
      } catch (lockCheckError) {
        // If table doesn't exist, assume phase is not locked and continue
      }

      // Get phases to determine if we're moving forward or backward
      let phases = [];
      try {
        const { CountryApplicationProcess } = require('../models');
        const countryProcess = await CountryApplicationProcess.findOne({
          where: { country, isActive: true }
        });

        if (countryProcess && countryProcess.applicationProcess) {
          phases = countryProcess.applicationProcess.steps || [];
        }
      } catch (err) {
      }

      // Normalize phases to ensure they all have a 'key' property
      // Handle both string arrays and object arrays
      const normalizedPhases = phases.map(p => {
        if (typeof p === 'string') {
          return { key: p };
        }
        return p && p.key ? p : { key: p };
      });

      // Fallback to default phases if none found
      if (normalizedPhases.length === 0) {
        normalizedPhases.push(
          { key: 'DOCUMENT_COLLECTION' },
          { key: 'UNIVERSITY_SHORTLISTING' },
          { key: 'APPLICATION_SUBMISSION' },
          { key: 'OFFER_RECEIVED' },
          { key: 'INITIAL_PAYMENT' },
          { key: 'INTERVIEW' },
          { key: 'FINANCIAL_TB_TEST' },
          { key: 'CAS_VISA' },
          { key: 'VISA_APPLICATION' },
          { key: 'ENROLLMENT' }
        );
      }

      const previousPhaseIndex = normalizedPhases.findIndex(p => p.key === previousPhase);
      const newPhaseIndex = normalizedPhases.findIndex(p => p.key === currentPhase);

      // Update phase metadata (only if table exists - gracefully handle if it doesn't)
      try {
        if (previousPhaseIndex !== -1 && newPhaseIndex !== -1) {
          // Mark previous phase as Completed if moving forward
          if (newPhaseIndex > previousPhaseIndex) {
            const previousPhaseMeta = await getOrCreatePhaseMetadata(id, country, previousPhase, 'Completed');
            // Check if this phase should be locked after completion (if it exceeded maxReopenAllowed)
            if (previousPhaseMeta && previousPhaseMeta.update && previousPhaseMeta.reopenCount > previousPhaseMeta.maxReopenAllowed) {
              await previousPhaseMeta.update({
                status: 'Locked',
                finalEditAllowed: false
              });
            } else if (previousPhaseMeta && previousPhaseMeta.update) {
              await previousPhaseMeta.update({ status: 'Completed' });
            }
          }

          // Mark new phase as Current
          await updatePhaseMetadataStatus(id, country, currentPhase, 'Current');

          // Reset phases after the new phase to Pending
          if (newPhaseIndex < normalizedPhases.length - 1) {
            const phasesToReset = normalizedPhases.slice(newPhaseIndex + 1);
            for (const phase of phasesToReset) {
              const phaseKey = typeof phase === 'string' ? phase : (phase?.key || phase);
              if (phaseKey) {
                await updatePhaseMetadataStatus(id, country, phaseKey, 'Pending');
              }
            }
          }
        }
      } catch (metadataError) {
        // If phase metadata operations fail (e.g., table doesn't exist), log but don't fail the phase update
        // Continue with the phase update even if metadata update fails
      }

      await countryProfile.update({
        currentPhase,
        lastUpdated: new Date()
      });

      // Automatically set student status to 'COMPLETED' when reaching ENROLLMENT phase
      if (currentPhase === 'ENROLLMENT' && student.status !== 'COMPLETED') {
        await student.update({ status: 'COMPLETED' });
      }
    } else {
      // Backward compatibility: update global student phase if no country specified
      // Note: Phase metadata is only tracked for country-specific phases
      // Update student phase
      const updateData = { currentPhase };

      // Automatically set status to 'COMPLETED' when student reaches ENROLLMENT phase
      if (currentPhase === 'ENROLLMENT' && student.status !== 'COMPLETED') {
        updateData.status = 'COMPLETED';
      }

      await student.update(updateData);
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

    // If moving to Offer Received phase (including Australia-specific Offer Letter), save selected universities with offers
    if ((currentPhase === 'OFFER_RECEIVED' || currentPhase === 'OFFER_LETTER_AUSTRALIA') &&
      req.body.selectedUniversities && Array.isArray(req.body.selectedUniversities)) {
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
      // Note: IDs may be stored as numbers or strings in notes, so compare as strings
      const selectedUniversityData = availableUniversities.find(u => String(u.id) === String(selectedUniversity));

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

    // If moving to Enrollment phase, save selected university for enrollment (must be from Offer Received universities for that country)
    if (currentPhase === 'ENROLLMENT') {
      const { selectedUniversity } = req.body;

      if (!selectedUniversity) {
        return res.status(400).json({
          message: 'Please select a university for Enrollment.'
        });
      }

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

      // For Enrollment we prefer offers list, but fallback to shortlist if offers missing (same as Initial Payment)
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
          message: 'No universities found for enrollment. Please mark Offer Received universities first (Offer Received phase), or shortlist universities.'
        });
      }

      // Verify selected university is from the available universities list
      // Note: IDs may be stored as numbers or strings in notes, so compare as strings
      const selectedUniversityData = availableUniversities.find(u => String(u.id) === String(selectedUniversity));

      if (!selectedUniversityData) {
        return res.status(400).json({
          message: 'Selected university is not in the available universities list for enrollment'
        });
      }

      const enrollmentData = {
        university: {
          id: selectedUniversityData.id,
          name: selectedUniversityData.name,
          country: selectedUniversityData.country,
          city: selectedUniversityData.city
        },
        selectedAt: new Date().toISOString(),
        isFallback: isFallback
      };

      // Store in country profile if country is specified, otherwise in student notes
      if (country && countryProfile) {
        const updatedCountryNotes = {
          ...existingNotes,
          enrollmentUniversity: enrollmentData
        };
        await countryProfile.update({
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        const updatedNotes = {
          ...existingNotes,
          enrollmentUniversity: enrollmentData
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

    // If moving to Visa Decision phase or updating Visa Decision status, save visa decision status
    if ((currentPhase === 'VISA_DECISION' || currentPhase?.includes('VISA_DECISION')) && req.body.visaDecisionStatus) {
      const { visaDecisionStatus } = req.body;

      // Validate visa decision status
      if (!['APPROVED', 'REJECTED'].includes(visaDecisionStatus)) {
        return res.status(400).json({
          message: 'Invalid visa decision status. Must be APPROVED or REJECTED.'
        });
      }

      // Store visa decision status
      const visaDecisionData = {
        status: visaDecisionStatus,
        updatedAt: new Date().toISOString()
      };

      // If country is specified, store in country profile notes
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        const updatedCountryNotes = {
          ...countryNotes,
          visaDecisionStatus: visaDecisionData
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
          visaDecisionStatus: visaDecisionData
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



    // Generic Payment Details Saving (Amount & Type)
    // Applies to INITIAL_PAYMENT and other payment-related phases
    const PAYMENT_PHASES = [
      'INITIAL_PAYMENT',
      'DEPOSIT_I20',
      'SEVIS_FEE',
      'GIC_OPTIONAL',
      'OSHC_TUITION_DEPOSIT',
      'INITIAL_TUITION_PAYMENT',
      'TUITION_FEE_PAYMENT',
      'ACCEPT_OFFER_PAY_DEPOSIT',
      'BLOCKED_ACCOUNT_HEALTH' // Germany
    ];

    if ((PAYMENT_PHASES.includes(currentPhase) || currentPhase.includes('PAYMENT') || currentPhase.includes('FEE') || currentPhase.includes('DEPOSIT')) && (req.body.paymentAmount || req.body.paymentType)) {
      const { paymentAmount, paymentType } = req.body;

      const paymentData = {
        amount: paymentAmount,
        type: paymentType, // 'INITIAL', 'HALF', 'COMPLETE'
        updatedAt: new Date().toISOString()
      };

      // If country is specified, store in country profile notes
      if (country && countryProfile) {
        const countryNotes = safeParseNotes(countryProfile.notes);
        // We use a specific key structure: payments.<phaseKey>
        const updatedCountryNotes = {
          ...countryNotes,
          payments: {
            ...(countryNotes.payments || {}),
            [currentPhase]: paymentData
          }
        };
        await countryProfile.update({
          notes: JSON.stringify(updatedCountryNotes),
          lastUpdated: new Date()
        });
      } else {
        // Store in student notes
        const existingNotes = safeParseNotes(student.notes);
        const updatedNotes = {
          ...existingNotes,
          payments: {
            ...(existingNotes.payments || {}),
            [currentPhase]: paymentData
          }
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
    } else if ((previousPhase === currentPhase && (currentPhase === 'VISA_DECISION' || currentPhase?.includes('VISA_DECISION')) && req.body.visaDecisionStatus)) {
      // Just updating Visa Decision status without changing phase
      const statusLabels = {
        'APPROVED': 'Approved',
        'REJECTED': 'Rejected'
      };
      activityDescription = remarks
        ? `${countryPrefix}Visa Decision status updated to ${statusLabels[req.body.visaDecisionStatus]}. Remarks: ${remarks}`
        : `${countryPrefix}Visa Decision status updated to ${statusLabels[req.body.visaDecisionStatus]}`;
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

        const marketingNotification = await Notification.create({
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

        try {
          await websocketService.sendNotification(student.marketingOwnerId, marketingNotification.toJSON());
        } catch (wsErr) {
          console.error('Error sending marketing notification via websocket:', wsErr);
        }
      } catch (notifError) {
        console.error('Error creating notification for marketing owner:', notifError);
        // Don't fail the request if notification creation fails
      }
    }

    // Notify telecaller who imported this lead (if any)
    try {
      const orConditions = [];
      if (student.email) {
        orConditions.push({ emailId: student.email });
      }
      if (student.phone) {
        orConditions.push({ contactNumber: student.phone });
      }
      if (orConditions.length) {
        const telecallerLead = await TelecallerImportedTask.findOne({
          where: {
            [Op.or]: orConditions
          }
        });

        if (telecallerLead?.telecallerId) {
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

          const telecallerNotification = await Notification.create({
            userId: telecallerLead.telecallerId,
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

          try {
            await websocketService.sendNotification(telecallerLead.telecallerId, telecallerNotification.toJSON());
          } catch (wsErr) {
          }
        }
      }
    } catch (teleNotifErr) {
    }

    // Clear dashboard cache to ensure stats update
    const cacheKey = `dashboard:${counselorId}`;
    await cacheUtils.del(cacheKey);

    // Reload country profile if it was updated
    if (countryProfile) {
      await countryProfile.reload();
    }

    // Broadcast phase update via WebSocket for real-time updates
    try {
      await websocketService.sendStudentPhaseUpdate(student.id, counselorId, {
        currentPhase: countryProfile ? countryProfile.currentPhase : student.currentPhase,
        previousPhase: previousPhase,
        country: country || null,
        countryProfile: countryProfile ? {
          id: countryProfile.id,
          country: countryProfile.country,
          currentPhase: countryProfile.currentPhase
        } : null
      });
    } catch (wsError) {
      // Don't fail the request if WebSocket broadcast fails
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
    res.status(500).json({
      success: false,
      message: 'Error sending email'
    });
  }
};

// Pause student application
exports.pauseStudent = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    console.log('Pause request received:', { id, counselorId, reason, body: req.body, bodyKeys: Object.keys(req.body || {}) });

    // Validate reason
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Pause reason is required'
      });
    }

    const reasonStr = typeof reason === 'string' ? reason.trim() : String(reason).trim();
    if (reasonStr === '') {
      return res.status(400).json({
        success: false,
        message: 'Pause reason cannot be empty'
      });
    }

    const student = await Student.findOne({
      where: {
        id,
        counselorId
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or you do not have permission to pause this student'
      });
    }

    if (student.isPaused) {
      return res.status(400).json({
        success: false,
        message: 'Student application is already paused'
      });
    }

    const updateData = {
      isPaused: true,
      pauseReason: reasonStr,
      pausedAt: new Date(),
      pausedBy: counselorId
    };

    console.log('Updating student with:', updateData);

    await student.update(updateData);

    // Track activity
    await trackActivity({
      type: 'STUDENT_PAUSED',
      userId: counselorId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      description: `Application paused: ${reason.trim()}`
    });

    // Clear cache
    await cacheUtils.clearPattern(`api:counselor/students:${counselorId}*`);
    await cacheUtils.clearPattern(`api:counselor/dashboard:${counselorId}*`);

    // Reload student to get fresh data
    await student.reload();

    // Broadcast student status update via WebSocket for real-time updates
    try {
      websocketService.broadcastToRoom(`counselor:${counselorId}`, 'student_status_updated', {
        studentId: student.id,
        isPaused: student.isPaused,
        pauseReason: student.pauseReason,
        pausedAt: student.pausedAt,
        updatedAt: student.updatedAt
      });
      websocketService.broadcastToRoom(`student:${student.id}`, 'student_status_updated', {
        studentId: student.id,
        isPaused: student.isPaused,
        pauseReason: student.pauseReason,
        pausedAt: student.pausedAt,
        updatedAt: student.updatedAt
      });
    } catch (wsError) {
      // Don't fail the request if WebSocket broadcast fails
      console.error('WebSocket broadcast error:', wsError);
    }

    res.json({
      success: true,
      message: 'Student application paused successfully',
      data: student
    });
  } catch (error) {
    console.error('Error pausing student:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Check if it's a database column error
    if (error.name === 'SequelizeDatabaseError' || error.message?.includes('column') || error.message?.includes('Unknown column')) {
      return res.status(500).json({
        success: false,
        message: 'Database schema error. Please ensure the database has been migrated with the pause fields (isPaused, pauseReason, pausedAt, pausedBy).'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error pausing student application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resume (play) student application
exports.playStudent = async (req, res) => {
  try {
    const counselorId = req.user.id;
    const { id } = req.params;

    const student = await Student.findOne({
      where: {
        id,
        counselorId
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // If student is not paused, return success (idempotent operation)
    // This handles cases where the student was already resumed or state is out of sync
    if (!student.isPaused) {
      return res.json({
        success: true,
        message: 'Student application is already active',
        data: student
      });
    }

    await student.update({
      isPaused: false,
      pauseReason: null,
      pausedAt: null,
      pausedBy: null
    });

    // Track activity
    await trackActivity({
      type: 'STUDENT_RESUMED',
      userId: counselorId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      description: 'Application resumed'
    });

    // Clear cache
    await cacheUtils.clearPattern(`api:counselor/students:${counselorId}*`);
    await cacheUtils.clearPattern(`api:counselor/dashboard:${counselorId}*`);

    // Reload student to get fresh data
    await student.reload();

    // Broadcast student status update via WebSocket for real-time updates
    try {
      websocketService.broadcastToRoom(`counselor:${counselorId}`, 'student_status_updated', {
        studentId: student.id,
        isPaused: student.isPaused,
        pauseReason: null,
        pausedAt: null,
        updatedAt: student.updatedAt
      });
      websocketService.broadcastToRoom(`student:${student.id}`, 'student_status_updated', {
        studentId: student.id,
        isPaused: student.isPaused,
        pauseReason: null,
        pausedAt: null,
        updatedAt: student.updatedAt
      });
    } catch (wsError) {
      // Don't fail the request if WebSocket broadcast fails
      console.error('WebSocket broadcast error:', wsError);
    }

    res.json({
      success: true,
      message: 'Student application resumed successfully',
      data: student
    });
  } catch (error) {
    console.error('Error resuming student:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming student application'
    });
  }
};