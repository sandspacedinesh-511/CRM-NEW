const { Op, fn, col, literal } = require('sequelize');
const { Student, Activity, User, Document, StudentUniversityApplication, University, Notification } = require('../models');
const { performanceLogger, errorLogger } = require('../utils/logger');

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MARKETING_ACTIVITY_TYPES = [
  'LEAD_CREATED'
];

const getStatusOptions = () =>
  Student?.rawAttributes?.status?.values || ['ACTIVE', 'DEFERRED', 'REJECTED', 'COMPLETED'];

const getPhaseOptions = () =>
  Student?.rawAttributes?.currentPhase?.values || [
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

const getStartOfWeek = (inputDate) => {
  const date = new Date(inputDate);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildMonthlySeries = (monthsBack, rawEntries, accessor) => {
  const series = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthLabels[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
    const match = rawEntries.find((entry) => entry.get(accessor) === key);
    series.push({
      month: label,
      total: match ? parseInt(match.get('count'), 10) : 0
    });
  }
  return series;
};

const formatLeadRecord = (studentInstance) => {
  const student = studentInstance.get
    ? studentInstance.get({ plain: true })
    : studentInstance;

  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const ageInDays = student.createdAt
    ? Math.max(
      0,
      Math.round(
        (Date.now() - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    )
    : null;

  // Parse notes to extract additional data
  let notesData = {};
  try {
    if (student.notes) {
      notesData = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
    }
  } catch (e) {
    console.log('Could not parse notes:', e);
  }

  // Handle targetCountries parsing (it could be a JSON string or a comma-separated string depending on legacy data)
  let countries = [];
  try {
    if (student.targetCountries) {
      if (student.targetCountries.startsWith('[')) {
        countries = JSON.parse(student.targetCountries);
      } else {
        countries = student.targetCountries.split(',').filter(Boolean);
      }
    } else if (notesData.countries) {
      countries = Array.isArray(notesData.countries) ? notesData.countries : [];
    }
  } catch (e) {
    console.warn('Failed to parse targetCountries:', e);
    countries = [];
  }

  return {
    id: student.id,
    name: fullName || 'Unnamed Lead',
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    phone: student.phone,
    status: student.status,
    currentPhase: student.currentPhase,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    counselor: student.counselor
      ? {
        id: student.counselor.id,
        name: student.counselor.name,
        email: student.counselor.email
      }
      : null,
    consultancyName: notesData.consultancyName || null,
    branch: student.preferredCourse || notesData.branch || null,
    universityName: student.preferredUniversity || notesData.universityName || null,
    yearOfStudy: student.yearOfStudy ?? notesData.yearOfStudy ?? null,
    completionYear: student.completionYear ?? notesData.completionYear ?? null,
    countries: countries.join(', '), // Return as comma-separated string for frontend compatibility
    parentsAnnualIncome: student.parentsAnnualIncome ?? notesData.parentsAnnualIncome ?? null,
    ageInDays
  };
};

const calculateLeadStats = (leads) => {
  const baseStats = {
    total: leads.length,
    active: 0,
    completed: 0,
    deferred: 0,
    rejected: 0,
    averageAgingDays: 0,
    statusBreakdown: {}
  };

  if (leads.length === 0) {
    return baseStats;
  }

  let totalAging = 0;

  leads.forEach((lead) => {
    const status = lead.status || 'UNKNOWN';
    baseStats.statusBreakdown[status] = (baseStats.statusBreakdown[status] || 0) + 1;
    if (status === 'ACTIVE') baseStats.active += 1;
    if (status === 'COMPLETED') baseStats.completed += 1;
    if (status === 'DEFERRED') baseStats.deferred += 1;
    if (status === 'REJECTED') baseStats.rejected += 1;

    if (typeof lead.ageInDays === 'number') {
      totalAging += lead.ageInDays;
    }
  });

  baseStats.averageAgingDays =
    leads.length && totalAging
      ? Math.round((totalAging / leads.length) * 10) / 10
      : 0;

  return baseStats;
};

const buildLeadFilters = (leads) => {
  const statuses = Array.from(
    new Set(
      leads
        .map((lead) => lead.status)
        .filter(Boolean)
    )
  ).sort();

  const phases = Array.from(
    new Set(
      leads
        .map((lead) => lead.currentPhase)
        .filter(Boolean)
    )
  ).sort();

  return {
    statuses: statuses.length ? statuses : getStatusOptions(),
    phases: phases.length ? phases : getPhaseOptions()
  };
};

const quoteIdentifier = (identifier = '') => `\`${String(identifier).replace(/`/g, '``')}\``;

const studentAlias = Student?.name || Student?.options?.name?.singular || 'Student';
const createdAtField = Student.rawAttributes?.createdAt?.fieldName || 'createdAt';
const updatedAtField = Student.rawAttributes?.updatedAt?.fieldName || 'updatedAt';
const qualifiedCreatedAt = `${quoteIdentifier(studentAlias)}.${quoteIdentifier(createdAtField)}`;
const qualifiedUpdatedAt = `${quoteIdentifier(studentAlias)}.${quoteIdentifier(updatedAtField)}`;
// Use the model alias for all SQL expressions to avoid "Unknown column 'Students.createdAt'" errors
const baseTableCreatedAt = qualifiedCreatedAt;
const baseTableUpdatedAt = qualifiedUpdatedAt;

const formatDateForSql = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

exports.createLead = async (req, res) => {
  try {
    const {
      studentName,
      consultancyName,
      branch,
      yearOfStudy,
      completionYear,
      countries,
      universityName,
      mobile,
      email,
      parentsAnnualIncome
    } = req.body || {};

    // Basic validation
    const isB2B = req.user?.role === 'b2b_marketing';

    // Detailed validation with specific error messages
    const validationErrors = [];

    if (!studentName || !String(studentName).trim()) {
      validationErrors.push('Student name is required');
    }

    if (!isB2B && (!branch || !String(branch).trim())) {
      validationErrors.push('Branch is required');
    }

    if (isB2B && (!consultancyName || !String(consultancyName).trim())) {
      validationErrors.push('Consultancy name is required');
    }

    if (yearOfStudy === undefined || yearOfStudy === null || yearOfStudy === '') {
      validationErrors.push('Year of study is required');
    }

    if (completionYear === undefined || completionYear === null || completionYear === '') {
      validationErrors.push('Completion year is required');
    }

    if (!Array.isArray(countries) || countries.length === 0) {
      validationErrors.push('At least one target country is required');
    }

    if (!universityName || !String(universityName).trim()) {
      validationErrors.push('University/College name is required');
    }

    // Mobile number is required for regular marketing, optional for B2B marketing
    if (!isB2B && (!mobile || !String(mobile).trim())) {
      validationErrors.push('Mobile number is required');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join('. '),
        errors: validationErrors
      });
    }

    // Normalise numeric fields to integers or null
    const normalizedYearOfStudy =
      yearOfStudy === undefined || yearOfStudy === null || yearOfStudy === ''
        ? null
        : parseInt(yearOfStudy, 10);

    if (isNaN(normalizedYearOfStudy)) {
      return res.status(400).json({
        success: false,
        message: 'Year of study must be a valid number'
      });
    }

    const normalizedCompletionYear =
      completionYear === undefined || completionYear === null || completionYear === ''
        ? null
        : parseInt(completionYear, 10);

    if (isNaN(normalizedCompletionYear)) {
      return res.status(400).json({
        success: false,
        message: 'Completion year must be a valid number'
      });
    }

    const normalizedParentsAnnualIncome =
      parentsAnnualIncome === undefined || parentsAnnualIncome === null || parentsAnnualIncome === ''
        ? null
        : parseInt(parentsAnnualIncome, 10);

    // Split student name into first/last
    const nameParts = String(studentName).trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Lead';

    const notesPayload = {
      branch,
      yearOfStudy: normalizedYearOfStudy,
      completionYear: normalizedCompletionYear,
      countries,
      universityName,
      parentsAnnualIncome: normalizedParentsAnnualIncome,
      consultancyName: consultancyName ? String(consultancyName).toUpperCase() : undefined
    };

    // Generate a placeholder email if none provided, to satisfy not-null/unique constraints
    const effectiveEmail =
      email && String(email).trim()
        ? String(email).trim()
        : `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@placeholder.local`;

    const student = await Student.create({
      firstName,
      lastName,
      email: effectiveEmail,
      phone: (mobile && String(mobile).trim()) ? String(mobile).trim() : null,
      preferredUniversity: universityName,
      preferredCourse: branch,
      yearOfStudy: normalizedYearOfStudy,
      completionYear: normalizedCompletionYear,
      targetCountries: Array.isArray(countries) ? JSON.stringify(countries) : null,
      parentsAnnualIncome: normalizedParentsAnnualIncome,
      status: 'ACTIVE',
      currentPhase: 'DOCUMENT_COLLECTION',
      marketingOwnerId: req.user.id,
      notes: JSON.stringify(notesPayload)
    });

    // Auto-create country profiles from selected countries
    if (Array.isArray(countries) && countries.length > 0) {
      const { ApplicationCountry } = require('../models');
      for (const country of countries) {
        try {
          await ApplicationCountry.create({
            studentId: student.id,
            country: country.trim(),
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
            notes: `Country profile auto-created from lead: ${country.trim()}. Application progress starts from beginning.`
          });
        } catch (error) {
          // Log but don't fail - country profile creation is not critical
          console.error(`Error creating country profile for ${country}:`, error.message);
        }
      }
    }

    // Log marketing activity for this new lead
    await Activity.create({
      type: 'LEAD_CREATED',
      description: `New lead: ${firstName} ${lastName} for ${universityName}`,
      studentId: student.id,
      userId: req.user.id,
      metadata: {
        branch,
        yearOfStudy,
        completionYear,
        countries,
        universityName,
        parentsAnnualIncome,
        consultancyName: consultancyName ? String(consultancyName).toUpperCase() : undefined,
        mobile,
        email: email || null
      }
    });

    const formattedLead = formatLeadRecord(student);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: formattedLead
    });
  } catch (error) {
    errorLogger.logError(error, {
      scope: 'marketing_create_lead',
      userId: req.user.id
    });

    // Log request body for debugging
    console.error('Error creating marketing lead:', {
      error: error.message,
      stack: error.stack,
      requestBody: {
        ...req.body,
        isB2B: req.user?.role === 'b2b_marketing'
      },
      userId: req.user?.id,
      userRole: req.user?.role
    });

    // Handle database validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationMessages = error.errors?.map(e => e.message) || [error.message];
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + validationMessages.join(', '),
        errors: validationMessages
      });
    }

    // Handle unique constraint errors (e.g., duplicate email)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'A lead with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const {
      studentName,
      consultancyName,
      branch,
      yearOfStudy,
      completionYear,
      countries,
      universityName,
      mobile,
      email,
      parentsAnnualIncome
    } = req.body || {};

    const student = await Student.findOne({
      where: {
        id: req.params.id,
        marketingOwnerId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const isB2B = req.user?.role === 'b2b_marketing';

    // Validate required fields - Mobile number is required for regular marketing, optional for B2B
    if (!isB2B && (!mobile || !mobile.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Normalise numeric fields, falling back to existing values when empty
    const normalizedYearOfStudy =
      yearOfStudy === undefined || yearOfStudy === null || yearOfStudy === ''
        ? student.yearOfStudy
        : parseInt(yearOfStudy, 10);
    const normalizedCompletionYear =
      completionYear === undefined || completionYear === null || completionYear === ''
        ? student.completionYear
        : parseInt(completionYear, 10);
    const normalizedParentsAnnualIncome =
      parentsAnnualIncome === undefined || parentsAnnualIncome === null || parentsAnnualIncome === ''
        ? student.parentsAnnualIncome
        : parseInt(parentsAnnualIncome, 10);

    const nameParts = String(studentName || `${student.firstName} ${student.lastName}`)
      .trim()
      .split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Lead';

    const notesPayload = {
      branch,
      yearOfStudy: normalizedYearOfStudy,
      completionYear: normalizedCompletionYear,
      countries,
      universityName,
      parentsAnnualIncome: normalizedParentsAnnualIncome,
      consultancyName: consultancyName ? String(consultancyName).toUpperCase() : undefined
    };

    const effectiveEmail =
      email && String(email).trim()
        ? String(email).trim()
        : student.email;

    await student.update({
      firstName,
      lastName,
      email: effectiveEmail,
      phone: (mobile && String(mobile).trim()) ? String(mobile).trim() : (student.phone || null),
      preferredUniversity: universityName ?? student.preferredUniversity,
      preferredCourse: isB2B ? student.preferredCourse : (branch ?? student.preferredCourse),
      yearOfStudy: normalizedYearOfStudy,
      completionYear: normalizedCompletionYear,
      targetCountries: Array.isArray(countries) ? JSON.stringify(countries) : student.targetCountries,
      parentsAnnualIncome: isB2B ? student.parentsAnnualIncome : normalizedParentsAnnualIncome,
      notes: JSON.stringify(notesPayload)
    });

    // Update latest LEAD_CREATED activity metadata/description for this lead
    const leadActivity = await Activity.findOne({
      where: {
        type: 'LEAD_CREATED',
        studentId: student.id,
        userId: req.user.id
      },
      order: [['createdAt', 'DESC']]
    });

    if (leadActivity) {
      await leadActivity.update({
        description: `New lead: ${firstName} ${lastName} for ${universityName}`,
        metadata: {
          branch,
          yearOfStudy,
          completionYear,
          countries,
          universityName,
          parentsAnnualIncome,
          consultancyName: consultancyName ? String(consultancyName).toUpperCase() : undefined,
          mobile,
          email: email || null
        }
      });
    }

    const formattedLead = formatLeadRecord(student);

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: formattedLead
    });
  } catch (error) {
    errorLogger.logError(error, {
      scope: 'marketing_update_lead',
      userId: req.user.id
    });
    console.error('Error updating marketing lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getDashboard = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_dashboard');

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = getStartOfWeek(now);
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
    const endOfPrevWeek = new Date(startOfWeek);
    endOfPrevWeek.setMilliseconds(endOfPrevWeek.getMilliseconds() - 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(startOfMonth);
    endOfPrevMonth.setMilliseconds(endOfPrevMonth.getMilliseconds() - 1);

    // Scope leads to the current marketing user
    const marketingOwnerWhere = { marketingOwnerId: req.user.id };

    const [totalLeads, activeLeads, convertedLeads, lostLeads, leadsToday, leadsThisWeek, leadsPrevWeek, leadsThisMonth, leadsPrevMonth] =
      await Promise.all([
        Student.count({ where: marketingOwnerWhere }),
        Student.count({ where: { ...marketingOwnerWhere, status: 'ACTIVE' } }),
        Student.count({ where: { ...marketingOwnerWhere, status: 'COMPLETED' } }),
        Student.count({ where: { ...marketingOwnerWhere, status: { [Op.in]: ['REJECTED', 'DEFERRED'] } } }),
        Student.count({
          where: {
            ...marketingOwnerWhere,
            [Op.and]: [literal(`${baseTableCreatedAt} >= '${formatDateForSql(startOfToday)}'`)]
          }
        }),
        Student.count({
          where: {
            ...marketingOwnerWhere,
            [Op.and]: [literal(`${baseTableCreatedAt} >= '${formatDateForSql(startOfWeek)}'`)]
          }
        }),
        Student.count({
          where: {
            [Op.and]: [
              marketingOwnerWhere,
              literal(
                `${baseTableCreatedAt} BETWEEN '${formatDateForSql(startOfPrevWeek)}' AND '${formatDateForSql(endOfPrevWeek)}'`
              )
            ]
          }
        }),
        Student.count({
          where: {
            ...marketingOwnerWhere,
            [Op.and]: [literal(`${baseTableCreatedAt} >= '${formatDateForSql(startOfMonth)}'`)]
          }
        }),
        Student.count({
          where: {
            [Op.and]: [
              marketingOwnerWhere,
              literal(
                `${baseTableCreatedAt} BETWEEN '${formatDateForSql(startOfPrevMonth)}' AND '${formatDateForSql(endOfPrevMonth)}'`
              )
            ]
          }
        })
      ]);

    const conversionRate = totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 100);

    const avgConversionResult = await Student.findOne({
      where: { status: 'COMPLETED' },
      attributes: [[literal(`AVG(DATEDIFF(${baseTableUpdatedAt}, ${baseTableCreatedAt}))`), 'avgConversionDays']],
      raw: true
    });

    const avgConversionDays = avgConversionResult?.avgConversionDays
      ? parseFloat(parseFloat(avgConversionResult.avgConversionDays).toFixed(1))
      : null;

    const startOfRange = new Date();
    startOfRange.setMonth(startOfRange.getMonth() - 5);
    startOfRange.setDate(1);
    startOfRange.setHours(0, 0, 0, 0);

    const [leadTrendRaw, conversionTrendRaw] = await Promise.all([
      Student.findAll({
        where: {
          ...marketingOwnerWhere,
          [Op.and]: [literal(`${baseTableCreatedAt} >= '${formatDateForSql(startOfRange)}'`)]
        },
        attributes: [
          [literal(`DATE_FORMAT(${baseTableCreatedAt}, '%Y-%m')`), 'month'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [literal(`DATE_FORMAT(${baseTableCreatedAt}, '%Y-%m')`)],
        order: [[literal(`DATE_FORMAT(${baseTableCreatedAt}, '%Y-%m')`), 'ASC']]
      }),
      Student.findAll({
        where: {
          ...marketingOwnerWhere,
          status: 'COMPLETED',
          [Op.and]: [literal(`${baseTableUpdatedAt} >= '${formatDateForSql(startOfRange)}'`)]
        },
        attributes: [
          [literal(`DATE_FORMAT(${baseTableUpdatedAt}, '%Y-%m')`), 'month'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [literal(`DATE_FORMAT(${baseTableUpdatedAt}, '%Y-%m')`)],
        order: [[literal(`DATE_FORMAT(${baseTableUpdatedAt}, '%Y-%m')`), 'ASC']]
      })
    ]);

    const leadTrend = buildMonthlySeries(6, leadTrendRaw, 'month');
    const conversionTrend = buildMonthlySeries(6, conversionTrendRaw, 'month');

    const phaseDistributionRaw = await Student.findAll({
      where: marketingOwnerWhere,
      attributes: ['currentPhase', [fn('COUNT', col('id')), 'count']],
      group: ['currentPhase'],
      order: [[literal('COUNT(id)'), 'DESC']]
    });

    const phaseDistribution = phaseDistributionRaw.map((item) => ({
      phase: item.currentPhase,
      count: parseInt(item.get('count'), 10)
    }));

    const engagementRaw = await Activity.findAll({
      where: {
        userId: req.user.id
      },
      attributes: ['type', [fn('COUNT', col('id')), 'count']],
      group: ['type']
    });

    const engagement = engagementRaw.reduce(
      (acc, item) => {
        const type = item.type;
        const count = parseInt(item.get('count'), 10);

        if (type === 'EMAIL_SENT') {
          acc.email += count;
        } else if (['DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED', 'DOCUMENT_UPLOAD'].includes(type)) {
          acc.documents += count;
        } else if (type === 'APPLICATION_UPDATE') {
          acc.applications += count;
        } else {
          acc.misc += count;
        }

        return acc;
      },
      { email: 0, documents: 0, applications: 0, misc: 0 }
    );

    const recentLeadsRaw = await Student.findAll({
      where: marketingOwnerWhere,
      limit: 10,
      order: [[literal(qualifiedCreatedAt), 'DESC']],
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'currentPhase', 'createdAt']
    });

    const recentLeads = recentLeadsRaw.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`.trim(),
      email: student.email,
      phone: student.phone,
      status: student.status,
      currentPhase: student.currentPhase,
      createdAt: student.createdAt
    }));

    const leadAgingExpressions = [
      ['within7', `SUM(CASE WHEN DATEDIFF(NOW(), ${qualifiedCreatedAt}) <= 7 THEN 1 ELSE 0 END)`],
      ['eightToFourteen', `SUM(CASE WHEN DATEDIFF(NOW(), ${qualifiedCreatedAt}) BETWEEN 8 AND 14 THEN 1 ELSE 0 END)`],
      ['fifteenToThirty', `SUM(CASE WHEN DATEDIFF(NOW(), ${qualifiedCreatedAt}) BETWEEN 15 AND 30 THEN 1 ELSE 0 END)`],
      ['overThirty', `SUM(CASE WHEN DATEDIFF(NOW(), ${qualifiedCreatedAt}) > 30 THEN 1 ELSE 0 END)`]
    ];

    const [leadAgingRaw] = await Student.findAll({
      where: { ...marketingOwnerWhere, status: { [Op.ne]: 'COMPLETED' } },
      attributes: leadAgingExpressions.map(([alias, expr]) => [literal(expr), alias]),
      raw: true
    });

    const leadAging = [
      { key: '0_7', label: '0-7 days', total: Number(leadAgingRaw?.within7 || 0) },
      { key: '8_14', label: '8-14 days', total: Number(leadAgingRaw?.eightToFourteen || 0) },
      { key: '15_30', label: '15-30 days', total: Number(leadAgingRaw?.fifteenToThirty || 0) },
      { key: '30_plus', label: '30+ days', total: Number(leadAgingRaw?.overThirty || 0) }
    ];

    const [topUniversitiesRaw, topCoursesRaw] = await Promise.all([
      Student.findAll({
        where: { ...marketingOwnerWhere, preferredUniversity: { [Op.ne]: null } },
        attributes: ['preferredUniversity', [fn('COUNT', col('id')), 'count']],
        group: ['preferredUniversity'],
        order: [[literal('COUNT(id)'), 'DESC']],
        limit: 5
      }),
      Student.findAll({
        where: { ...marketingOwnerWhere, preferredCourse: { [Op.ne]: null } },
        attributes: ['preferredCourse', [fn('COUNT', col('id')), 'count']],
        group: ['preferredCourse'],
        order: [[literal('COUNT(id)'), 'DESC']],
        limit: 5
      })
    ]);

    const topUniversities = topUniversitiesRaw.map((item) => ({
      name: item.preferredUniversity,
      total: parseInt(item.get('count'), 10)
    }));

    const topCourses = topCoursesRaw.map((item) => ({
      name: item.preferredCourse,
      total: parseInt(item.get('count'), 10)
    }));

    const teamPerformanceRaw = await Activity.findAll({
      where: {
        type: { [Op.in]: MARKETING_ACTIVITY_TYPES }
      },
      attributes: ['userId', [fn('COUNT', col('Activity.id')), 'activityCount']],
      group: ['userId', 'user.id', 'user.name'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          where: { role: 'marketing' }
        }
      ],
      order: [[literal('activityCount'), 'DESC']],
      limit: 6
    });

    const teamPerformance = teamPerformanceRaw.map((entry) => ({
      userId: entry.userId,
      name: entry.user?.name || 'Unknown',
      email: entry.user?.email || null,
      activityCount: parseInt(entry.get('activityCount'), 10)
    }));

    const recentActivitiesRaw = await Activity.findAll({
      where: {
        type: { [Op.in]: MARKETING_ACTIVITY_TYPES },
        userId: req.user.id
      },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ]
    });

    const recentActivities = recentActivitiesRaw.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt,
      student: activity.student
        ? {
          id: activity.student.id,
          name: `${activity.student.firstName} ${activity.student.lastName}`.trim(),
          status: activity.student.status
        }
        : null,
      user: activity.user
        ? {
          id: activity.user.id,
          name: activity.user.name
        }
        : null
    }));

    const weekOverWeekGrowth =
      leadsPrevWeek === 0
        ? null
        : Math.round(((leadsThisWeek - leadsPrevWeek) / leadsPrevWeek) * 100);

    const monthOverMonthGrowth =
      leadsPrevMonth === 0
        ? null
        : Math.round(((leadsThisMonth - leadsPrevMonth) / leadsPrevMonth) * 100);

    const responsePayload = {
      success: true,
      data: {
        stats: {
          totalLeads,
          activeLeads,
          convertedLeads,
          lostLeads,
          conversionRate,
          avgConversionDays,
          leadsToday,
          leadsThisWeek,
          leadsPrevWeek,
          leadsThisMonth,
          leadsPrevMonth,
          weekOverWeekGrowth,
          monthOverMonthGrowth
        },
        leadTrend,
        phaseDistribution,
        engagement,
        recentLeads,
        insights: {
          conversionTrend,
          leadAging,
          topUniversities,
          topCourses,
          teamPerformance,
          recentActivities
        }
      }
    };

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/dashboard', duration, 200, req.user.id);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json(responsePayload);
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/dashboard', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_dashboard',
      userId: req.user.id
    });
    console.error('Error fetch marketing dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load marketing dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const fetchMarketingLeadsData = async ({
  status = 'ALL',
  phase = 'ALL',
  search = '',
  counselorId,
  sort = 'newest',
  limit,
  marketingOwnerId
}) => {
  const whereClauses = [];

  if (marketingOwnerId) {
    whereClauses.push({ marketingOwnerId });
  }

  if (status && status !== 'ALL') {
    whereClauses.push({ status });
  }

  if (phase && phase !== 'ALL') {
    whereClauses.push({ currentPhase: phase });
  }

  if (counselorId) {
    whereClauses.push({ counselorId });
  }

  if (search && search.trim()) {
    const likePattern = `%${search.trim()}%`;
    whereClauses.push({
      [Op.or]: [
        { firstName: { [Op.like]: likePattern } },
        { lastName: { [Op.like]: likePattern } },
        { email: { [Op.like]: likePattern } },
        { phone: { [Op.like]: likePattern } }
      ]
    });
  }

  const where =
    whereClauses.length > 0
      ? { [Op.and]: whereClauses }
      : {};

  const order = [];
  if (sort === 'oldest') {
    order.push([literal(baseTableCreatedAt), 'ASC']);
  } else if (sort === 'name') {
    order.push(['lastName', 'ASC'], ['firstName', 'ASC']);
  } else {
    order.push([literal(baseTableCreatedAt), 'DESC']);
  }

  const fetchLimit = limit ? Math.min(parseInt(limit, 10) || 0, 500) : undefined;

  const leads = await Student.findAll({
    where,
    include: [
      {
        model: User,
        as: 'counselor',
        attributes: ['id', 'name', 'email']
      }
    ],
    order,
    limit: fetchLimit
  });

  const formattedLeads = leads.map(formatLeadRecord);
  const stats = calculateLeadStats(formattedLeads);
  const filters = buildLeadFilters(formattedLeads);

  return {
    leads: formattedLeads,
    stats,
    filters
  };
};

exports.getLeads = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_leads_list');

  try {
    const payload = await fetchMarketingLeadsData({
      ...(req.query || {}),
      marketingOwnerId: req.user.id
    });

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/leads', duration, 200, req.user.id);
    res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/leads', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_leads_list',
      userId: req.user.id
    });
    console.error('Error fetching marketing leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketing leads',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.exportLeads = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_leads_export');

  try {
    const { status = 'ALL', phase = 'ALL', search = '', counselorId } = req.query;

    const { leads } = await fetchMarketingLeadsData({
      status,
      phase,
      search,
      counselorId,
      limit: 5000,
      sort: 'newest',
      marketingOwnerId: req.user.id
    });

    if (!leads.length) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=marketing-leads.csv');
      res.send('message\nNo leads found for the selected filters');
      return;
    }

    const csvHeaders = [
      'Lead Name',
      'Email',
      'Phone',
      'Status',
      'Current Phase',
      'Lead Age (days)',
      'Counselor Name',
      'Counselor Email',
      'Created At',
      'Updated At'
    ];

    const csvRows = leads.map((lead) => {
      const createdAt = lead.createdAt ? new Date(lead.createdAt).toISOString() : '';
      const updatedAt = lead.updatedAt ? new Date(lead.updatedAt).toISOString() : '';
      return [
        `"${lead.name || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.status || ''}"`,
        `"${lead.currentPhase || ''}"`,
        lead.ageInDays ?? '',
        `"${lead.counselor?.name || ''}"`,
        `"${lead.counselor?.email || ''}"`,
        `"${createdAt}"`,
        `"${updatedAt}"`
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=marketing_leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    res.send(csvContent);

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/leads/export', duration, 200, req.user.id);
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/leads/export', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_leads_export',
      userId: req.user.id
    });
    console.error('Error exporting marketing leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export marketing leads',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getActivities = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_activities_list');

  try {
    const {
      type = 'ALL',
      search = '',
      startDate,
      endDate,
      limit = 100
    } = req.query;

    const where = {
      type: {
        [Op.in]: MARKETING_ACTIVITY_TYPES
      }
    };

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) {
          where.createdAt[Op.gte] = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          where.createdAt[Op.lte] = end;
        }
      }
    }

    const activities = await Activity.findAll({
      where: {
        ...where,
        userId: req.user.id
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: [
            'id',
            'firstName',
            'lastName',
            'email',
            'status',
            'preferredCourse',
            'yearOfStudy',
            'completionYear',
            'targetCountries',
            'preferredUniversity',
            'parentsAnnualIncome'
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit, 10) || 100, 500)
    });

    const processed = activities
      .map((activityInstance) => {
        const activity = activityInstance.get
          ? activityInstance.get({ plain: true })
          : activityInstance;

        let countries = [];
        try {
          const rawCountries = activity.student?.targetCountries;
          if (rawCountries) {
            if (rawCountries.startsWith('[')) {
              countries = JSON.parse(rawCountries);
            } else {
              countries = rawCountries.split(',').filter(Boolean);
            }
          }
        } catch (e) {
          console.warn('Failed to parse targetCountries in activity:', e);
          countries = [];
        }

        return {
          id: activity.id,
          type: activity.type,
          description: activity.description,
          timestamp: activity.createdAt,
          student: activity.student
            ? {
              id: activity.student.id,
              firstName: activity.student.firstName,
              lastName: activity.student.lastName,
              name: `${activity.student.firstName || ''} ${activity.student.lastName || ''}`.trim(),
              email: activity.student.email,
              status: activity.student.status,
              branch: activity.student.preferredCourse,
              yearOfStudy: activity.student.yearOfStudy,
              completionYear: activity.student.completionYear,
              countries: countries.join(', '),
              universityName: activity.student.preferredUniversity,
              parentsAnnualIncome: activity.student.parentsAnnualIncome
            }
            : null,
          user: activity.user
            ? {
              id: activity.user.id,
              name: activity.user.name,
              email: activity.user.email
            }
            : null,
          metadata: activity.metadata || null
        };
      })
      .filter((activity) => {
        if (!search || !search.trim()) {
          return true;
        }
        const term = search.trim().toLowerCase();
        const haystack = [
          activity.description,
          activity.type,
          activity.user?.name,
          activity.user?.email,
          activity.student?.name
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/activities', duration, 200, req.user.id);

    res.json({
      success: true,
      data: {
        activities: processed,
        meta: {
          total: processed.length,
          availableTypes: MARKETING_ACTIVITY_TYPES
        }
      }
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/marketing/activities', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_activities_list',
      userId: req.user.id
    });
    console.error('Error fetching marketing activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load marketing activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get lead details by ID
exports.getLeadDetails = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_lead_details');

  try {
    const lead = await Student.findOne({
      where: {
        id: req.params.id,
        marketingOwnerId: req.user.id
      },
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: User,
          as: 'marketingOwner',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/marketing/leads/${req.params.id}`, duration, 200, req.user.id);

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/marketing/leads/${req.params.id}`, duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_lead_details',
      userId: req.user.id,
      leadId: req.params.id
    });
    console.error('Error fetching lead details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get lead documents
exports.getLeadDocuments = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_lead_documents');

  try {
    // First, verify the lead belongs to this marketing user
    const lead = await Student.findOne({
      where: {
        id: req.params.id,
        marketingOwnerId: req.user.id
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const { type, status } = req.query;
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
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/marketing/leads/${req.params.id}/documents`, duration, 200, req.user.id);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/marketing/leads/${req.params.id}/documents`, duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_lead_documents',
      userId: req.user.id,
      leadId: req.params.id
    });
    console.error('Error fetching lead documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Upload document for lead
exports.uploadLeadDocument = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_upload_document');

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { type, description } = req.body;
    const studentId = req.params.id;

    // Verify lead belongs to this marketing user
    const lead = await Student.findOne({
      where: {
        id: studentId,
        marketingOwnerId: req.user.id
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    // Upload to DigitalOcean Spaces (with fallback to local storage if DO is not configured)
    let uploadResult;
    const DigitalOceanStorageService = require('../services/digitalOceanStorage');

    try {
      const storageService = new DigitalOceanStorageService();
      uploadResult = await storageService.uploadFile(req.file, 'marketing-documents');
    } catch (storageError) {
      console.error('DigitalOcean Spaces upload failed, trying local storage:', storageError);

      // Fallback to local storage if DigitalOcean is not configured
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');

      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'marketing-documents');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Save file locally
      fs.writeFileSync(filePath, req.file.buffer);

      uploadResult = {
        url: `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/marketing-documents/${uniqueFilename}`,
        key: `marketing-documents/${uniqueFilename}`,
        bucket: 'local-storage',
        region: 'local',
        localPath: filePath
      };
    }

    // Validate document type
    const validTypes = ['ID_CARD', 'ENROLLMENT_LETTER', 'OTHER'];
    const documentType = type && validTypes.includes(type) ? type : 'OTHER';

    // Save document record to database
    const document = await Document.create({
      name: req.file.originalname,
      type: documentType,
      description: description || '',
      path: uploadResult.key,
      url: uploadResult.url,
      mimeType: req.file.mimetype,
      size: req.file.size,
      studentId: studentId,
      status: 'PENDING',
      uploadedBy: req.user.id,
      priority: 'MEDIUM'
    });

    console.log('Document saved to database:', {
      id: document.id,
      type: document.type,
      name: document.name,
      studentId: document.studentId,
      path: document.path
    });

    // Create activity
    await Activity.create({
      type: 'DOCUMENT_UPLOAD',
      description: `Document uploaded by marketing: ${document.name} (${document.type})`,
      studentId: studentId,
      userId: req.user.id,
      metadata: {
        documentId: document.id,
        documentType: document.type,
        documentName: document.name
      }
    });

    const duration = timer.end();
    performanceLogger.logApiRequest('POST', `/api/marketing/leads/${studentId}/documents/upload`, duration, 201, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('POST', `/api/marketing/leads/${req.params.id}/documents/upload`, duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_upload_document',
      userId: req.user.id,
      leadId: req.params.id
    });
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Save reminder for lead
exports.saveReminder = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_save_reminder');

  try {
    const { leadId, scheduledTime, reminderText } = req.body;

    if (!leadId || !scheduledTime || !reminderText) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID, scheduled time, and reminder text are required'
      });
    }

    // Verify lead belongs to this marketing user
    const lead = await Student.findOne({
      where: {
        id: leadId,
        marketingOwnerId: req.user.id
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reminder time must be in the future'
      });
    }

    // Create notification as reminder
    const notification = await Notification.create({
      userId: req.user.id,
      type: 'reminder',
      title: `Reminder: ${lead.firstName} ${lead.lastName}`,
      message: reminderText,
      priority: 'high',
      leadId: leadId,
      scheduledTime: scheduledDate,
      reminderText: reminderText,
      isRead: false,
      metadata: {
        leadName: `${lead.firstName} ${lead.lastName}`,
        leadEmail: lead.email
      }
    });

    const duration = timer.end();
    performanceLogger.logApiRequest('POST', '/api/marketing/leads/reminder', duration, 201, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Reminder saved successfully',
      data: notification
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('POST', '/api/marketing/leads/reminder', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_save_reminder',
      userId: req.user.id,
      leadId: req.body.leadId
    });
    console.error('Error saving reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save reminder',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Save remarks for lead
exports.saveRemarks = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_save_remarks');

  try {
    const { leadId, remarks } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID is required'
      });
    }

    // Verify lead belongs to this marketing user
    const lead = await Student.findOne({
      where: {
        id: leadId,
        marketingOwnerId: req.user.id
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or access denied'
      });
    }

    // Parse existing notes or create new object
    let notesData = {};
    try {
      if (lead.notes) {
        notesData = typeof lead.notes === 'string' ? JSON.parse(lead.notes) : lead.notes;
      }
    } catch (e) {
      // If notes is not valid JSON, start fresh
      notesData = {};
    }

    // Add remarks to notes
    notesData.remarks = remarks || '';
    notesData.remarksUpdatedAt = new Date().toISOString();
    notesData.remarksUpdatedBy = req.user.id;

    // Update student with remarks
    await lead.update({
      notes: JSON.stringify(notesData)
    });

    const duration = timer.end();
    performanceLogger.logApiRequest('POST', '/api/marketing/leads/remarks', duration, 200, req.user.id);

    res.json({
      success: true,
      message: 'Remarks saved successfully',
      data: {
        leadId: lead.id,
        remarks: remarks
      }
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('POST', '/api/marketing/leads/remarks', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_save_remarks',
      userId: req.user.id,
      leadId: req.body.leadId
    });
    console.error('Error saving remarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save remarks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get lead applications
exports.getLeadApplications = async (req, res) => {
  const timer = performanceLogger.startTimer('marketing_lead_applications');

  try {
    // First, verify the lead belongs to this marketing user
    const lead = await Student.findOne({
      where: {
        id: req.params.id,
        marketingOwnerId: req.user.id
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const applications = await StudentUniversityApplication.findAll({
      where: { studentId: req.params.id },
      include: [
        {
          model: University,
          as: 'university',
          attributes: ['id', 'name', 'country', 'city', 'ranking']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/marketing/leads/${req.params.id}/applications`, duration, 200, req.user.id);

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/marketing/leads/${req.params.id}/applications`, duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'marketing_lead_applications',
      userId: req.user.id,
      leadId: req.params.id
    });
    console.error('Error fetching lead applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

