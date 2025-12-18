const {
  Student,
  University,
  StudentUniversityApplication,
  ApplicationCountry,
  User,
  Activity,
  Document
} = require('../models');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Get all applications for a counselor with enhanced filtering
exports.getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      country,
      intakeTerm,
      courseLevel,
      search,
      sortBy = 'applicationDeadline',
      sortOrder = 'ASC',
      hasMultipleCountries,
      hasMultipleApplications
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    const includeClause = [
      {
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      },
      {
        model: University,
        as: 'university',
        attributes: ['id', 'name', 'country', 'city', 'ranking']
      }
    ];

    // Apply filters
    if (status) {
      whereClause.applicationStatus = status;
    }
    if (intakeTerm) {
      whereClause.intakeTerm = intakeTerm;
    }
    if (courseLevel) {
      whereClause.courseLevel = courseLevel;
    }
    if (search) {
      includeClause[0].where = {
        ...includeClause[0].where,
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    // Filter by country (normalize country names to handle variations)
    if (country) {
      const normalizeCountryForFilter = (c) => {
        if (!c) return [c];
        const upper = c.trim().toUpperCase();
        if (upper === 'UK' || upper === 'U.K.' || upper === 'U.K' || upper === 'UNITED KINGDOM') {
          return ['United Kingdom', 'UK', 'U.K.', 'U.K'];
        }
        if (upper === 'USA' || upper === 'U.S.A.' || upper === 'US' || upper === 'U.S.' || upper === 'UNITED STATES' || upper === 'UNITED STATES OF AMERICA') {
          return ['United States', 'USA', 'U.S.A.', 'US', 'U.S.', 'United States of America'];
        }
        return [c];
      };
      const countryVariations = normalizeCountryForFilter(country);
      includeClause[1].where = countryVariations.length > 1 ? { country: { [Op.in]: countryVariations } } : { country: countryVariations[0] };
    }

    // Filter students with multiple countries
    if (hasMultipleCountries === 'true') {
      const studentsWithMultipleCountries = await ApplicationCountry.findAll({
        attributes: ['studentId'],
        group: ['studentId'],
        having: sequelize.literal('COUNT(DISTINCT country) > 1')
      });
      const studentIds = studentsWithMultipleCountries.map(s => s.studentId);
      includeClause[0].where = {
        ...includeClause[0].where,
        id: { [Op.in]: studentIds }
      };
    }

    // Filter students with multiple applications
    if (hasMultipleApplications === 'true') {
      const studentsWithMultipleApplications = await StudentUniversityApplication.findAll({
        attributes: ['studentId'],
        group: ['studentId'],
        having: sequelize.literal('COUNT(*) > 1')
      });
      const studentIds = studentsWithMultipleApplications.map(s => s.studentId);
      includeClause[0].where = {
        ...includeClause[0].where,
        id: { [Op.in]: studentIds }
      };
    }

    // Handle sorting by country or other fields
    let orderClause;
    if (sortBy === 'country') {
      // Sort by university country
      orderClause = [[{ model: University, as: 'university' }, 'country', sortOrder]];
    } else if (sortBy === 'student') {
      // Sort by student name
      orderClause = [[{ model: Student, as: 'student' }, 'firstName', sortOrder]];
    } else if (sortBy === 'university') {
      // Sort by university name
      orderClause = [[{ model: University, as: 'university' }, 'name', sortOrder]];
    } else if (sortBy === 'applicationDeadline') {
      orderClause = [['applicationDeadline', sortOrder]];
    } else if (sortBy === 'createdAt') {
      orderClause = [['createdAt', sortOrder]];
    } else {
      // Default sorting
      orderClause = [[sortBy, sortOrder]];
    }

    const applications = await StudentUniversityApplication.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: applications.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(applications.count / limit),
        totalItems: applications.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// Get applications by country for a student
exports.getStudentApplicationsByCountry = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student belongs to counselor
    const student = await Student.findOne({
      where: { id: studentId, counselorId: req.user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const applications = await StudentUniversityApplication.findAll({
      where: { studentId },
      include: [
        {
          model: University,
          as: 'university',
          attributes: ['id', 'name', 'country', 'city', 'ranking', 'acceptanceRate']
        }
      ],
      order: [['priority', 'ASC'], ['applicationDeadline', 'ASC']]
    });

    // Group applications by country
    const applicationsByCountry = applications.reduce((acc, app) => {
      const country = app.university.country;
      if (!acc[country]) {
        acc[country] = {
          country,
          applications: [],
          totalApplications: 0,
          primaryApplications: 0,
          backupApplications: 0,
          acceptedApplications: 0,
          rejectedApplications: 0,
          pendingApplications: 0,
          totalApplicationFees: 0,
          totalScholarshipAmount: 0
        };
      }

      acc[country].applications.push(app);
      acc[country].totalApplications++;

      if (app.isPrimaryChoice) acc[country].primaryApplications++;
      if (app.isBackupChoice) acc[country].backupApplications++;
      if (app.applicationStatus === 'ACCEPTED') acc[country].acceptedApplications++;
      if (app.applicationStatus === 'REJECTED') acc[country].rejectedApplications++;
      if (['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(app.applicationStatus)) {
        acc[country].pendingApplications++;
      }

      if (app.applicationFee) acc[country].totalApplicationFees += parseFloat(app.applicationFee);
      if (app.scholarshipAmount) acc[country].totalScholarshipAmount += parseFloat(app.scholarshipAmount);

      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(applicationsByCountry),
      totalCountries: Object.keys(applicationsByCountry).length,
      totalApplications: applications.length
    });
  } catch (error) {
    console.error('Error fetching student applications by country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications by country'
    });
  }
};

// Create multiple applications for a student
exports.createMultipleApplications = async (req, res) => {
  try {
    const { studentId, applications } = req.body;

    // Verify student belongs to counselor
    const student = await Student.findOne({
      where: { id: studentId, counselorId: req.user.id }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const createdApplications = [];
    const countries = new Set();

    for (const appData of applications) {
      const application = await StudentUniversityApplication.create({
        ...appData,
        studentId
      });

      // Get university country
      const university = await University.findByPk(appData.universityId);
      if (university) {
        countries.add(university.country);
      }

      const fullApplication = await StudentUniversityApplication.findOne({
        where: { id: application.id },
        include: [
          {
            model: University,
            as: 'university',
            attributes: ['id', 'name', 'country', 'city']
          }
        ]
      });

      createdApplications.push(fullApplication);
    }

    // Update or create ApplicationCountry records
    for (const country of countries) {
      await ApplicationCountry.upsert({
        studentId,
        country,
        lastUpdated: new Date()
      });
    }

    // Log activity
    await Activity.create({
      type: 'MULTIPLE_APPLICATIONS_CREATED',
      description: `Created ${applications.length} applications for ${countries.size} countries`,
      studentId,
      userId: req.user.id,
      metadata: {
        applicationCount: applications.length,
        countries: Array.from(countries)
      }
    });

    res.status(201).json({
      success: true,
      data: createdApplications,
      message: `Successfully created ${applications.length} applications`
    });
  } catch (error) {
    console.error('Error creating multiple applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create applications'
    });
  }
};

// Update application priority and choices
exports.updateApplicationPriority = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { priority, isPrimaryChoice, isBackupChoice } = req.body;

    // Verify application belongs to counselor's student
    const application = await StudentUniversityApplication.findOne({
      where: { id: applicationId },
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: ['id']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update the application
    await application.update({
      priority,
      isPrimaryChoice,
      isBackupChoice
    });

    // Log activity
    await Activity.create({
      type: 'APPLICATION_PRIORITY_UPDATED',
      description: `Updated application priority to ${priority}`,
      studentId: application.studentId,
      userId: req.user.id,
      metadata: {
        applicationId,
        priority,
        isPrimaryChoice,
        isBackupChoice
      }
    });

    res.json({
      success: true,
      data: application,
      message: 'Application priority updated successfully'
    });
  } catch (error) {
    console.error('Error updating application priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application priority'
    });
  }
};

// Get students with multiple country applications
exports.getStudentsWithMultipleCountries = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get all country profiles for this counselor's students
    const allCountryProfiles = await ApplicationCountry.findAll({
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'currentPhase', 'marketingOwnerId']
        }
      ]
    });

    console.log('Total country profiles fetched:', allCountryProfiles.length);
    console.log('Counselor ID:', req.user.id);

    // Group by student and count distinct countries
    const studentCountryMap = {};
    allCountryProfiles.forEach(profile => {
      const studentId = profile.studentId;
      if (!studentCountryMap[studentId]) {
        studentCountryMap[studentId] = {
          student: profile.student,
          countries: new Set()
        };
      }
      if (profile.country) {
        studentCountryMap[studentId].countries.add(profile.country);
      }
    });


    // Filter students with more than 1 country
    const multiCountryStudents = Object.entries(studentCountryMap)
      .filter(([_, data]) => data.countries.size > 1)
      .map(([studentId, data]) => ({
        studentId: parseInt(studentId),
        countryCount: data.countries.size,
        student: data.student
      }))
      .sort((a, b) => b.countryCount - a.countryCount);

    console.log('Multi-country students found:', multiCountryStudents.length);
    console.log('Student details:', multiCountryStudents.map(s => ({ id: s.studentId, name: s.student?.firstName, countries: s.countryCount })));

    // Apply pagination
    const paginatedStudents = multiCountryStudents.slice(offset, offset + parseInt(limit));
    const studentIds = paginatedStudents.map(item => item.studentId);

    // If no students found, return empty result
    if (studentIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit)
        }
      });
    }

    // Fetch details for these students to calculate progress
    const studentDetails = await Student.findAll({
      where: { id: { [Op.in]: studentIds } },
      include: [
        {
          model: ApplicationCountry,
          as: 'countryProfiles'
        },
        {
          model: Document,
          as: 'documents',
          where: { status: { [Op.in]: ['PENDING', 'APPROVED'] } },
          required: false,
        },
        {
          model: StudentUniversityApplication,
          as: 'applications',
          include: [
            {
              model: University,
              as: 'university',
              attributes: ['country']
            }
          ]
        }
      ]
    });

    // Map details for easy access
    const studentsMap = studentDetails.reduce((acc, student) => {
      acc[student.id] = student;
      return acc;
    }, {});

    // Helper to calculate progress based on country-specific phase and documents
    const calculateProgress = (student, country) => {
      try {
        const PHASES = [
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

        // Get country-specific profile
        const profile = student.countryProfiles?.find(p => p.country === country);
        if (!profile) {
          // If no profile exists for this country, return 0
          return 0;
        }

        // Use country-specific phase, not student's global phase
        const currentPhase = profile.currentPhase || 'DOCUMENT_COLLECTION';
        const phaseIndex = PHASES.indexOf(currentPhase);

        if (phaseIndex === -1) {
          // Phase not found, assume starting phase
          return 0;
        }

        // Calculate base progress from completed phases
        // Each phase represents 10% of total progress
        const completedPhases = phaseIndex;
        let progress = (completedPhases / PHASES.length) * 100;

        // Add granular progress for current phase based on completion
        if (currentPhase === 'DOCUMENT_COLLECTION') {
          const requiredDocs = ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME'];
          
          // Count unique uploaded document types that are approved or pending
          const uploadedTypes = (student.documents || [])
            .filter(d => requiredDocs.includes(d.type) && ['PENDING', 'APPROVED'].includes(d.status))
            .map(d => d.type);

          const uniqueUploaded = new Set(uploadedTypes).size;
          // Document collection phase progress (0-10% of total)
          const phaseProgress = (uniqueUploaded / requiredDocs.length) * 10;
          progress = phaseProgress; // Start from 0, progress within this phase
        } else if (currentPhase === 'UNIVERSITY_SHORTLISTING') {
          // Check if universities have been shortlisted (check applications for this country)
          const countryApplications = (student.applications || []).filter(
            app => app.university?.country === country
          );
          const hasShortlisted = countryApplications.length > 0;
          // Phase is 10-20% of total, add partial if shortlisted
          progress = 10 + (hasShortlisted ? 10 : 5);
        } else if (currentPhase === 'APPLICATION_SUBMISSION') {
          const countryApplications = (student.applications || []).filter(
            app => app.university?.country === country && app.applicationStatus === 'SUBMITTED'
          );
          const hasSubmitted = countryApplications.length > 0;
          // Phase is 20-30% of total
          progress = 20 + (hasSubmitted ? 10 : 5);
        } else if (currentPhase === 'OFFER_RECEIVED') {
          const countryApplications = (student.applications || []).filter(
            app => app.university?.country === country && app.applicationStatus === 'ACCEPTED'
          );
          const hasOffer = countryApplications.length > 0;
          // Phase is 30-40% of total
          progress = 30 + (hasOffer ? 10 : 5);
        } else if (currentPhase === 'INITIAL_PAYMENT') {
          // Phase is 40-50% of total
          progress = 40 + 5;
        } else if (currentPhase === 'INTERVIEW') {
          // Phase is 50-60% of total
          progress = 50 + 5;
        } else if (currentPhase === 'FINANCIAL_TB_TEST') {
          // Phase is 60-70% of total
          progress = 60 + 5;
        } else if (currentPhase === 'CAS_VISA') {
          // Phase is 70-80% of total
          progress = 70 + 5;
        } else if (currentPhase === 'VISA_APPLICATION') {
          // Phase is 80-90% of total
          progress = 80 + 5;
        } else if (currentPhase === 'ENROLLMENT') {
          // Phase is 90-100% of total
          progress = 90 + 5;
        } else {
          // Default: add 5% to indicate phase is started
          progress = (completedPhases / PHASES.length) * 100 + 5;
        }

        // Ensure progress doesn't exceed 100%
        return Math.min(Math.round(progress), 100);
      } catch (err) {
        console.error(`Error calculating progress for student ${student.id || 'unknown'} country ${country}:`, err);
        return 0;
      }
    };

    // Helper to clean country name in responses
    const cleanCountryName = (country) => {
      if (!country) return '';
      return country
        .replace(/[\[\]"]/g, '')
        .trim();
    };

    // Construct result with calculated progress using ApplicationCountry data
    const result = paginatedStudents.map(item => {
      const student = studentsMap[item.studentId];
      if (!student) return null;

      // Get countries from countryProfiles with individual progress calculation
      const countries = (student.countryProfiles || []).map(profile => {
        // Calculate progress for this specific country
        const cleanedCountry = cleanCountryName(profile.country);
        const progress = calculateProgress(student, cleanedCountry);
        
        return {
          country: cleanedCountry,
          progress: progress,
          currentPhase: profile.currentPhase || 'DOCUMENT_COLLECTION',
          preferredCountry: profile.preferredCountry || false,
          visaStatus: profile.visaStatus || 'NOT_STARTED'
        };
      });

      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        studentName: `${student.firstName} ${student.lastName}`,
        countries,
        countryCount: countries.length,
        applications: student.applications || [],
      };
    }).filter(Boolean);

    // Get total count from the filtered list
    const totalCount = multiCountryStudents.length;

    res.json({
      success: true,
      data: result,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching students with multiple countries:', error);
    if (error.original) console.error('Original SQL Error:', error.original);
    if (error.errors) console.error('Validation Errors:', error.errors);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch students with multiple countries'
    });
  }
};

// Get students without dual applications (single country applications only)
exports.getStudentsWithoutDualApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get students with only single country applications
    const studentsWithSingleCountry = await StudentUniversityApplication.findAll({
      attributes: [
        'studentId',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('university.country'))), 'countryCount'],
        [sequelize.fn('GROUP_CONCAT', sequelize.fn('DISTINCT', sequelize.col('university.country'))), 'countries']
      ],
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'currentPhase']
        },
        {
          model: University,
          as: 'university',
          attributes: []
        }
      ],
      group: ['studentId'],
      having: sequelize.literal('COUNT(DISTINCT university.country) = 1'),
      order: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('university.country'))), 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get the student IDs
    const studentIds = studentsWithSingleCountry.map(item => item.studentId);

    // Get all applications for these students
    const applications = await StudentUniversityApplication.findAll({
      where: {
        studentId: { [Op.in]: studentIds }
      },
      include: [
        {
          model: University,
          as: 'university',
          attributes: ['id', 'name', 'country', 'city']
        }
      ],
      order: [['applicationDate', 'DESC']]
    });

    // Group applications by student
    const applicationsByStudent = {};
    applications.forEach(app => {
      if (!applicationsByStudent[app.studentId]) {
        applicationsByStudent[app.studentId] = [];
      }
      applicationsByStudent[app.studentId].push(app);
    });

    // Combine student data with their applications
    const result = studentsWithSingleCountry.map(item => ({
      ...item.student.toJSON(),
      applications: applicationsByStudent[item.studentId] || [],
      countryCount: item.dataValues.countryCount,
      countries: item.dataValues.countries ? item.dataValues.countries.split(',') : []
    }));

    // Get total count of students with single country
    const totalCountResult = await StudentUniversityApplication.findAll({
      attributes: [
        'studentId',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('university.country'))), 'countryCount']
      ],
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId: req.user.id },
          attributes: ['id']
        },
        {
          model: University,
          as: 'university',
          attributes: []
        }
      ],
      group: ['studentId'],
      having: sequelize.literal('COUNT(DISTINCT university.country) = 1')
    });

    const totalCount = totalCountResult.length;

    res.json({
      success: true,
      data: result,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching students without dual applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students without dual applications'
    });
  }
};

// Get application statistics for dashboard
exports.getApplicationStatistics = async (req, res) => {
  try {
    const counselorId = req.user.id;

    // Get total applications
    const totalApplications = await StudentUniversityApplication.count({
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId },
          attributes: []
        }
      ]
    });

    // Get applications by status
    const applicationsByStatus = await StudentUniversityApplication.findAll({
      attributes: [
        'applicationStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId },
          attributes: []
        }
      ],
      group: ['applicationStatus']
    });

    // Get applications by country
    const applicationsByCountry = await StudentUniversityApplication.findAll({
      attributes: [
        [sequelize.col('university.country'), 'country'],
        [sequelize.fn('COUNT', sequelize.col('StudentUniversityApplication.id')), 'count']
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
          attributes: []
        }
      ],
      group: ['university.country'],
      order: [[sequelize.fn('COUNT', sequelize.col('StudentUniversityApplication.id')), 'DESC']]
    });

    // Get students with multiple applications
    const studentsWithMultipleApplications = await StudentUniversityApplication.findAll({
      attributes: [
        'studentId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'applicationCount']
      ],
      include: [
        {
          model: Student,
          as: 'student',
          where: { counselorId },
          attributes: ['firstName', 'lastName']
        }
      ],
      group: ['studentId'],
      having: sequelize.literal('COUNT(*) > 1'),
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    res.json({
      success: true,
      data: {
        totalApplications,
        applicationsByStatus,
        applicationsByCountry,
        studentsWithMultipleApplications,
        multipleApplicationStudents: studentsWithMultipleApplications.length
      }
    });
  } catch (error) {
    console.error('Error fetching application statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application statistics'
    });
  }
};

module.exports = exports;
