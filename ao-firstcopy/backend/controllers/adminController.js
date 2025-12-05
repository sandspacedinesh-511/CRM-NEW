const {
  User,
  Student,
  Document,
  University,
  StudentUniversityApplication,
  Activity,
  Task,
  Note,
  DeletedRecord,
  sequelize,
  TelecallerImportedTask,
  Notification
} = require('../models');
const { Op, Sequelize } = require('sequelize');
const telecallerController = require('./telecallerController');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const subDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
};

const quoteIdentifier = (identifier = '') => `\`${String(identifier).replace(/`/g, '``')}\``;
const studentTableRef = Student.getTableName ? Student.getTableName() : 'Students';
const studentTableName = typeof studentTableRef === 'string' ? studentTableRef : studentTableRef.tableName || 'Students';
const studentAlias = Student?.name || Student?.options?.name?.singular || 'Student';
const createdAtField = Student.rawAttributes?.createdAt?.fieldName || 'createdAt';
const updatedAtField = Student.rawAttributes?.updatedAt?.fieldName || 'updatedAt';
const aliasCreatedAt = `${quoteIdentifier(studentAlias)}.${quoteIdentifier(createdAtField)}`;
const aliasUpdatedAt = `${quoteIdentifier(studentAlias)}.${quoteIdentifier(updatedAtField)}`;
const baseCreatedAt = `${quoteIdentifier(studentTableName)}.${quoteIdentifier(createdAtField)}`;

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const weekAgo = subDays(today, 7);
    const monthAgo = subDays(today, 30);

    const totalCounselors = await User.count({ where: { role: 'counselor' } });
    const totalStudents = await Student.count();
    const totalUniversities = await University.count();
    const pendingDocuments = await Document.count({ where: { status: 'PENDING' } });
    
    const activeApplications = await Student.count({ 
      where: { currentPhase: { [Op.not]: 'DOCUMENT_COLLECTION' } }
    });
    const successfulApplications = await Student.count({
      where: { currentPhase: 'CAS_VISA' }
    });

    const todayApplications = await Student.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday]
        }
      }
    });

    const thisWeekApplications = await Student.count({
      where: {
        createdAt: {
          [Op.gte]: weekAgo
        }
      }
    });

    const thisMonthApplications = await Student.count({
      where: {
        createdAt: {
          [Op.gte]: monthAgo
        }
      }
    });

    const successRate = activeApplications > 0 
      ? Math.round((successfulApplications / activeApplications) * 100) 
      : 0;

    const lastMonthApplications = await Student.count({
      where: {
        createdAt: {
          [Op.between]: [subDays(monthAgo, 30), monthAgo]
        }
      }
    });

    const monthlyGrowth = lastMonthApplications > 0 
      ? Math.round(((thisMonthApplications - lastMonthApplications) / lastMonthApplications) * 100)
      : 0;

    const completedStudents = await Student.findAll({
      where: { currentPhase: 'CAS_VISA' },
      attributes: ['createdAt', 'updatedAt']
    });

    let averageProcessingTime = 0;
    if (completedStudents.length > 0) {
      const totalDays = completedStudents.reduce((sum, student) => {
        const days = Math.ceil((new Date(student.updatedAt) - new Date(student.createdAt)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      averageProcessingTime = Math.round(totalDays / completedStudents.length);
    }

    const recentActivities = await Promise.all([
      Student.findAll({
        limit: 8,
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'counselor',
          attributes: ['name']
        }],
        attributes: ['id', 'firstName', 'lastName', 'createdAt', 'currentPhase']
      }),
      Document.findAll({
        limit: 8,
        order: [['createdAt', 'DESC']],
        include: [{
          model: Student,
          as: 'student',
          attributes: ['firstName', 'lastName']
        }],
        attributes: ['id', 'type', 'createdAt', 'status']
      }),
      Student.findAll({
        where: {
          updatedAt: { [Op.not]: null }
        },
        limit: 8,
        order: [['updatedAt', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'currentPhase', 'updatedAt']
      }),
      StudentUniversityApplication.findAll({
        limit: 8,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['firstName', 'lastName']
          },
          {
            model: University,
            as: 'university',
            attributes: ['name']
          }
        ],
        attributes: ['id', 'applicationStatus', 'createdAt']
      })
    ]);

    const activities = [
      ...recentActivities[0].map(student => ({
        id: `student-${student.id}`,
        type: 'New Student',
        description: `${student.firstName} ${student.lastName} added by Counselor ${student.counselor?.name || 'Unknown'}`,
        timestamp: student.createdAt,
        metadata: { phase: student.currentPhase }
      })),
      ...recentActivities[1].map(doc => ({
        id: `doc-${doc.id}`,
        type: 'Document Upload',
        description: `${doc.type} uploaded for ${doc.student?.firstName} ${doc.student?.lastName}`,
        timestamp: doc.createdAt,
        metadata: { status: doc.status }
      })),
      ...recentActivities[2].map(student => ({
        id: `status-${student.id}`,
        type: 'Phase Update',
        description: `${student.firstName} ${student.lastName}'s application phase updated to ${student.currentPhase}`,
        timestamp: student.updatedAt,
        metadata: { phase: student.currentPhase }
      })),
      ...recentActivities[3].map(app => ({
        id: `app-${app.id}`,
        type: 'Application',
        description: `Application to ${app.university?.name || 'Unknown University'} for ${app.student?.firstName} ${app.student?.lastName}`,
        timestamp: app.createdAt,
        metadata: { status: app.applicationStatus }
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json({
      stats: {
        totalCounselors,
        totalStudents,
        totalUniversities,
        activeApplications,
        successRate,
        pendingDocuments,
        todayApplications,
        thisWeekApplications,
        thisMonthApplications,
        monthlyGrowth,
        averageProcessingTime,
        pendingApprovals: pendingDocuments
      },
      recentActivities: activities
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching dashboard statistics' 
    });
  }
};

exports.getAnalytics = async (req, res) => {
  const analytics = {
    phaseDistribution: [],
    monthlyApplications: [],
    universityDistribution: [],
    counselorPerformance: [],
    documentStats: [],
    applicationTrends: []
  };

  try {
    try {
      const studentCount = await Student.count();
      
      if (studentCount === 0) {
        analytics.phaseDistribution = [];
      } else {
        const phases = Student.rawAttributes.currentPhase.values;
        
        const phaseResults = await Student.findAll({
          attributes: [
            [
              Sequelize.fn('COALESCE', 
                Sequelize.col('currentPhase'), 
                'NOT_STARTED'
              ), 
              'currentPhase'
            ],
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
          ],
          group: ['currentPhase'],
          raw: true
        });

        const phaseMap = phaseResults.reduce((acc, { currentPhase, count }) => {
          acc[currentPhase || 'NOT_STARTED'] = parseInt(count);
          return acc;
        }, {});

        analytics.phaseDistribution = phases.map(phase => ({
          currentPhase: phase,
          count: phaseMap[phase] || 0
        }));

        if (phaseMap['NOT_STARTED']) {
          analytics.phaseDistribution.push({
            currentPhase: 'NOT_STARTED',
            count: phaseMap['NOT_STARTED']
          });
        }
      }
    } catch (error) {
      console.error('Error fetching phase distribution:', error);
      throw new Error(`Failed to fetch phase distribution data: ${error.message}`);
    }

    try {
      const monthLiteral = Sequelize.literal(`DATE_FORMAT(${aliasCreatedAt}, '%Y-%m')`);
      analytics.monthlyApplications = await Student.findAll({
        attributes: [
          [monthLiteral, 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 11))
          }
        },
        group: [monthLiteral],
        order: [[monthLiteral, 'ASC']],
        raw: true
      });

      const months = new Array(12).fill(0).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().slice(0, 7); 
      }).reverse();

      const monthlyMap = analytics.monthlyApplications.reduce((acc, { month, count }) => {
        acc[month] = parseInt(count);
        return acc;
      }, {});

      analytics.monthlyApplications = months.map(month => ({
        month,
        count: monthlyMap[month] || 0
      }));
    } catch (error) {
      console.error('Error fetching monthly applications:', error);
      throw new Error(`Failed to fetch monthly applications data: ${error.message}`);
    }

    try {
      const universityResults = await StudentUniversityApplication.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('StudentUniversityApplication.id')), 'count']
        ],
        include: [{
          model: University,
          as: 'university',
          attributes: ['id', 'name'],
          required: true
        }],
        group: ['university.id', 'university.name'],
        having: Sequelize.where(
          Sequelize.fn('COUNT', Sequelize.col('StudentUniversityApplication.id')),
          '>',
          0
        ),
        order: [[Sequelize.fn('COUNT', Sequelize.col('StudentUniversityApplication.id')), 'DESC']],
        limit: 10
      });

      analytics.universityDistribution = universityResults.map(result => ({
        name: result.university.name,
        count: parseInt(result.getDataValue('count'))
      }));
    } catch (error) {
      console.error('Error fetching university distribution:', error);
      throw new Error(`Failed to fetch university distribution data: ${error.message}`);
    }

    try {
      const counselors = await User.findAll({
        where: { role: 'counselor' },
        attributes: ['id', 'name', 'email', 'active', 'createdAt'],
        include: [{
          model: Student,
          as: 'students',
          attributes: ['id', 'currentPhase', 'createdAt'],
        }]
      });

      analytics.counselorPerformance = counselors.map(counselor => {
        const totalStudents = counselor.students.length;
        const successfulApplications = counselor.students.filter(
          student => student.currentPhase === 'CAS_VISA'
        ).length;
        const activeApplications = counselor.students.filter(
          student => student.currentPhase !== 'DOCUMENT_COLLECTION'
        ).length;

        return {
          id: counselor.id,
          name: counselor.name,
          email: counselor.email,
          active: counselor.active,
          totalStudents,
          successfulApplications,
          activeApplications,
          successRate: totalStudents > 0 ? Math.round((successfulApplications / totalStudents) * 100) : 0,
          createdAt: counselor.createdAt
        };
      }).sort((a, b) => b.totalStudents - a.totalStudents);
    } catch (error) {
      console.error('Error fetching counselor performance:', error);
      throw new Error(`Failed to fetch counselor performance data: ${error.message}`);
    }

    try {
      // Get document stats by type
      const documentStats = await Document.findAll({
        attributes: [
          'type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['type'],
        raw: true
      });

      // Get status counts separately
      const pendingCount = await Document.count({ where: { status: 'PENDING' } });
      const approvedCount = await Document.count({ where: { status: 'APPROVED' } });
      const rejectedCount = await Document.count({ where: { status: 'REJECTED' } });

      analytics.documentStats = documentStats.map(stat => ({
        type: stat.type,
        total: parseInt(stat.count),
        pending: 0, // Will be calculated separately
        approved: 0,
        rejected: 0
      }));

      // Add overall status counts
      analytics.documentStats.push({
        type: 'OVERALL',
        total: pendingCount + approvedCount + rejectedCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      });
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw new Error(`Failed to fetch document statistics: ${error.message}`);
    }

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const applicationMonthLiteral = Sequelize.literal(`DATE_FORMAT(${aliasCreatedAt}, '%Y-%m')`);
      analytics.applicationTrends = await Student.findAll({
        attributes: [
          [applicationMonthLiteral, 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
          [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN currentPhase = \'CAS_VISA\' THEN 1 END')), 'completed'],
          [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN currentPhase != \'DOCUMENT_COLLECTION\' THEN 1 END')), 'active']
        ],
        where: {
          createdAt: {
            [Op.gte]: sixMonthsAgo
          }
        },
        group: [applicationMonthLiteral],
        order: [[applicationMonthLiteral, 'ASC']],
        raw: true
      });

      const months = new Array(6).fill(0).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().slice(0, 7);
      }).reverse();

      const trendsMap = analytics.applicationTrends.reduce((acc, trend) => {
        acc[trend.month] = {
          month: trend.month,
          total: parseInt(trend.total),
          completed: parseInt(trend.completed),
          active: parseInt(trend.active)
        };
        return acc;
      }, {});

      analytics.applicationTrends = months.map(month => ({
        month,
        total: trendsMap[month]?.total || 0,
        completed: trendsMap[month]?.completed || 0,
        active: trendsMap[month]?.active || 0
      }));
    } catch (error) {
      console.error('Error fetching application trends:', error);
      throw new Error(`Failed to fetch application trends: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Analytics data fetched successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error fetching analytics data',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

exports.exportAnalytics = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    const analytics = {
      phaseDistribution: [],
      monthlyApplications: [],
      universityDistribution: [],
      counselorPerformance: [],
      documentStats: [],
      applicationTrends: []
    };

    const studentCount = await Student.count();
    if (studentCount > 0) {
      const phases = Student.rawAttributes.currentPhase.values;
      const phaseResults = await Student.findAll({
        attributes: [
          [Sequelize.fn('COALESCE', Sequelize.col('currentPhase'), 'NOT_STARTED'), 'currentPhase'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['currentPhase'],
        raw: true
      });

      const phaseMap = phaseResults.reduce((acc, { currentPhase, count }) => {
        acc[currentPhase || 'NOT_STARTED'] = parseInt(count);
        return acc;
      }, {});

      analytics.phaseDistribution = phases.map(phase => ({
        currentPhase: phase,
        count: phaseMap[phase] || 0
      }));
    }

    const exportMonthLiteral = Sequelize.literal(`DATE_FORMAT(${aliasCreatedAt}, '%Y-%m')`);
    analytics.monthlyApplications = await Student.findAll({
      attributes: [
        [exportMonthLiteral, 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 11))
        }
      },
      group: [exportMonthLiteral],
      order: [[exportMonthLiteral, 'ASC']],
      raw: true
    });

    const universityResults = await StudentUniversityApplication.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('StudentUniversityApplication.id')), 'count']
      ],
      include: [{
        model: University,
        as: 'university',
        attributes: ['id', 'name'],
        required: true
      }],
      group: ['university.id', 'university.name'],
      having: Sequelize.where(
        Sequelize.fn('COUNT', Sequelize.col('StudentUniversityApplication.id')),
        '>',
        0
      ),
      order: [[Sequelize.fn('COUNT', Sequelize.col('StudentUniversityApplication.id')), 'DESC']],
      limit: 10
    });

    analytics.universityDistribution = universityResults.map(result => ({
      name: result.university.name,
      count: parseInt(result.getDataValue('count'))
    }));

    const counselors = await User.findAll({
      where: { role: 'counselor' },
      attributes: ['id', 'name', 'email', 'active', 'createdAt'],
      include: [{
        model: Student,
        as: 'students',
        attributes: ['id', 'currentPhase', 'createdAt'],
      }]
    });

    analytics.counselorPerformance = counselors.map(counselor => {
      const totalStudents = counselor.students.length;
      const successfulApplications = counselor.students.filter(
        student => student.currentPhase === 'CAS_VISA'
      ).length;
      const activeApplications = counselor.students.filter(
        student => student.currentPhase !== 'DOCUMENT_COLLECTION'
      ).length;

      return {
        id: counselor.id,
        name: counselor.name,
        email: counselor.email,
        active: counselor.active,
        totalStudents,
        successfulApplications,
        activeApplications,
        successRate: totalStudents > 0 ? Math.round((successfulApplications / totalStudents) * 100) : 0,
        createdAt: counselor.createdAt
      };
    });

    if (format === 'csv') {
      const csvData = [];
      
      csvData.push(['Phase Distribution']);
      csvData.push(['Phase', 'Count']);
      analytics.phaseDistribution.forEach(phase => {
        csvData.push([phase.currentPhase, phase.count]);
      });
      
      csvData.push([]);
      
      csvData.push(['Monthly Applications']);
      csvData.push(['Month', 'Count']);
      analytics.monthlyApplications.forEach(month => {
        csvData.push([month.month, month.count]);
      });
      
      csvData.push([]);
      
      csvData.push(['University Distribution']);
      csvData.push(['University', 'Applications']);
      analytics.universityDistribution.forEach(uni => {
        csvData.push([uni.name, uni.count]);
      });
      
      csvData.push([]);
      
      csvData.push(['Counselor Performance']);
      csvData.push(['Name', 'Email', 'Total Students', 'Active Applications', 'Success Rate']);
      analytics.counselorPerformance.forEach(counselor => {
        csvData.push([
          counselor.name,
          counselor.email,
          counselor.totalStudents,
          counselor.activeApplications,
          `${counselor.successRate}%`
        ]);
      });
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: analytics
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error exporting analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getCounselors = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const counselors = await User.findAll({
      where: { role: 'counselor' },
      attributes: ['id', 'name', 'email', 'active', 'createdAt', 'specialization', 'phone', 'experience', 'bio'],
      include: [{
        model: Student,
        as: 'students',
        attributes: ['id', 'currentPhase'],
        required: false  // LEFT JOIN instead of INNER JOIN to avoid errors
      }]
    });
    const counselorStats = counselors.map(counselor => {
      // Safely handle students array that might be undefined or null
      const students = Array.isArray(counselor.students) ? counselor.students : [];
      return {
        id: counselor.id,
        name: counselor.name,
        email: counselor.email,
        active: counselor.active,
        specialization: counselor.specialization,
        phone: counselor.phone,
        experience: counselor.experience,
        bio: counselor.bio,
        totalStudents: students.length,
        successfulApplications: students.filter(
          student => student.currentPhase === 'CAS_VISA'
        ).length,
        createdAt: counselor.createdAt
      };
    });
    
    res.json({
      success: true,
      message: 'Counselors fetched successfully',
      data: counselorStats
    });
  } catch (error) {
    console.error('[ERROR] Error fetching counselors:', error.message);
    console.error('[STACK] Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching counselor list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.addCounselor = async (req, res) => {
  try {
    const { name, email, password, phone, specialization, experience, bio } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: name, email, password' 
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const counselor = await User.create({
      name, email, password, phone, specialization, experience, bio,
      role: 'counselor', active: true
    });

    res.status(201).json({
      success: true,
      message: 'Counselor created successfully',
      data: {
        id: counselor.id, name: counselor.name, email: counselor.email,
        phone: counselor.phone, specialization: counselor.specialization,
        experience: counselor.experience, bio: counselor.bio, active: counselor.active
      }
    });
  } catch (error) {
    console.error('[ERROR] Error creating counselor:', error.message);
    
    // Handle validation errors (e.g., password policy)
    if (error.name === 'SequelizeValidationError') {
      const validationMessages = error.errors.map(e => e.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: validationMessages,
        details: process.env.NODE_ENV === 'development' ? validationMessages : undefined
      });
    }
    
    // Handle unique constraint errors (e.g., duplicate email)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      success: false,
      message: 'Error creating counselor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.updateCounselorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const counselor = await User.findOne({
      where: { id, role: 'counselor' }
    });

    if (!counselor) {
      return res.status(404).json({ 
        success: false,
        message: 'Counselor not found' 
      });
    }

    await counselor.update({ active });
    res.json({ 
      success: true,
      message: 'Counselor status updated successfully',
      data: { active: counselor.active }
    });
  } catch (error) {
    console.error('Error updating counselor status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating counselor status',
      error: error.message
    });
  }
};

exports.updateCounselor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, specialization, experience, bio } = req.body;

    const counselor = await User.findOne({
      where: { id, role: 'counselor' }
    });

    if (!counselor) {
      return res.status(404).json({ 
        success: false,
        message: 'Counselor not found' 
      });
    }

    if (email !== counselor.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: 'Email already exists' 
        });
      }
    }

    await counselor.update({ 
      name, 
      email, 
      phone, 
      specialization, 
      experience, 
      bio 
    });
    
    res.json({
      success: true,
      message: 'Counselor updated successfully',
      data: {
        id: counselor.id,
        name: counselor.name,
        email: counselor.email,
        phone: counselor.phone,
        specialization: counselor.specialization,
        experience: counselor.experience,
        bio: counselor.bio,
        active: counselor.active
      }
    });
  } catch (error) {
    console.error('Error updating counselor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating counselor',
      error: error.message
    });
  }
};

exports.deleteCounselor = async (req, res) => {
  try {
    const { id } = req.params;

    const counselor = await User.findOne({
      where: { id, role: 'counselor' },
      include: [{
        model: Student,
        as: 'students'
      }]
    });

    if (!counselor) {
      return res.status(404).json({ 
        success: false,
        message: 'Counselor not found' 
      });
    }

    const studentsCount = Array.isArray(counselor.students) ? counselor.students.length : 0;
    if (studentsCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete counselor with assigned students. Please reassign students first.',
        data: { studentCount: studentsCount }
      });
    }

    await counselor.destroy();
    res.json({ 
      success: true,
      message: 'Counselor deleted successfully',
      data: { id: counselor.id, name: counselor.name }
    });
  } catch (error) {
    console.error('Error deleting counselor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting counselor',
      error: error.message
    });
  }
};

const BASIC_USER_ATTRIBUTES = ['id', 'name', 'email', 'phone', 'active', 'createdAt'];

const roleLabels = {
  telecaller: 'Telecaller',
  marketing: 'Marketing team member',
  b2b_marketing: 'B2B marketing team member'
};

const buildBasicUserResponse = (user) => {
  const plain = user.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    email: plain.email,
    phone: plain.phone,
    active: plain.active,
    createdAt: plain.createdAt
  };
};

const createRoleControllers = (role) => {
  const roleLabel = roleLabels[role] || 'User';

  const list = async (req, res) => {
    try {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const users = await User.findAll({
        where: { role },
        attributes: BASIC_USER_ATTRIBUTES,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        message: `${roleLabel}s fetched successfully`,
        data: users.map(buildBasicUserResponse)
      });
    } catch (error) {
      console.error(`[ERROR] Error fetching ${roleLabel.toLowerCase()}s:`, error.message);
      res.status(500).json({
        success: false,
        message: `Error fetching ${roleLabel.toLowerCase()} list`,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };

  const create = async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, email, password'
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone,
        role,
        active: true
      });

      res.status(201).json({
        success: true,
        message: `${roleLabel} created successfully`,
        data: buildBasicUserResponse(user)
      });
    } catch (error) {
      console.error(`[ERROR] Error creating ${roleLabel.toLowerCase()}:`, error.message);

      if (error.name === 'SequelizeValidationError') {
        const validationMessages = error.errors.map(e => e.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationMessages,
          details: process.env.NODE_ENV === 'development' ? validationMessages : undefined
        });
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: `Error creating ${roleLabel.toLowerCase()}`,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };

  const updateStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;

      const user = await User.findOne({
        where: { id, role }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `${roleLabel} not found`
        });
      }

      await user.update({ active });
      res.json({
        success: true,
        message: `${roleLabel} status updated successfully`,
        data: { active: user.active }
      });
    } catch (error) {
      console.error(`Error updating ${roleLabel.toLowerCase()} status:`, error);
      res.status(500).json({
        success: false,
        message: `Error updating ${roleLabel.toLowerCase()} status`,
        error: error.message
      });
    }
  };

  const update = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, password } = req.body;

      const user = await User.findOne({
        where: { id, role }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `${roleLabel} not found`
        });
      }

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      const updates = {};
      if (typeof name !== 'undefined') updates.name = name;
      if (typeof email !== 'undefined') updates.email = email;
      if (typeof phone !== 'undefined') updates.phone = phone;
      if (password) updates.password = password;

      if (Object.keys(updates).length === 0) {
        return res.json({
          success: true,
          message: `${roleLabel} updated successfully`,
          data: buildBasicUserResponse(user)
        });
      }

      await user.update(updates);

      res.json({
        success: true,
        message: `${roleLabel} updated successfully`,
        data: buildBasicUserResponse(user)
      });
    } catch (error) {
      console.error(`Error updating ${roleLabel.toLowerCase()}:`, error);
      res.status(500).json({
        success: false,
        message: `Error updating ${roleLabel.toLowerCase()}`,
        error: error.message
      });
    }
  };

  const remove = async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findOne({
        where: { id, role }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `${roleLabel} not found`
        });
      }

      await user.destroy();
      res.json({
        success: true,
        message: `${roleLabel} deleted successfully`,
        data: { id: user.id, name: user.name }
      });
    } catch (error) {
      console.error(`Error deleting ${roleLabel.toLowerCase()}:`, error);
      res.status(500).json({
        success: false,
        message: `Error deleting ${roleLabel.toLowerCase()}`,
        error: error.message
      });
    }
  };

  return {
    list,
    create,
    updateStatus,
    update,
    remove
  };
};

const telecallerControllers = createRoleControllers('telecaller');
exports.getTelecallers = telecallerControllers.list;
exports.addTelecaller = telecallerControllers.create;
exports.updateTelecallerStatus = telecallerControllers.updateStatus;
exports.updateTelecaller = telecallerControllers.update;
exports.deleteTelecaller = telecallerControllers.remove;

// Admin view: telecaller dashboard/queue for a specific telecaller
exports.getTelecallerDashboardAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const telecaller = await User.findOne({
      where: { id, role: 'telecaller' },
      attributes: BASIC_USER_ATTRIBUTES
    });

    if (!telecaller) {
      return res.status(404).json({
        success: false,
        message: 'Telecaller not found'
      });
    }

    // Reuse the telecaller dashboard logic by impersonating the selected telecaller
    const impersonatedReq = {
      ...req,
      user: {
        id: telecaller.id,
        role: 'telecaller'
      }
    };

    return telecallerController.getDashboard(impersonatedReq, res);
  } catch (error) {
    console.error('Error fetching telecaller dashboard for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load telecaller dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: assign a telecaller-imported lead to a specific counselor
exports.assignTelecallerImportedLeadToCounselorAdmin = async (req, res) => {
  try {
    const { telecallerId, leadId } = req.params;
    const { counselorId } = req.body || {};

    if (!counselorId) {
      return res.status(400).json({
        success: false,
        message: 'counselorId is required'
      });
    }

    const counselor = await User.findOne({
      where: { id: counselorId, role: 'counselor' },
      attributes: ['id', 'name', 'email']
    });

    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }

    const importedLead = await TelecallerImportedTask.findOne({
      where: {
        id: leadId,
        telecallerId
      }
    });

    if (!importedLead) {
      return res.status(404).json({
        success: false,
        message: 'Imported lead not found for this telecaller'
      });
    }

    if (!importedLead.isLead) {
      return res.status(400).json({
        success: false,
        message: 'This imported task is not marked as a lead'
      });
    }

    // Try to find an existing student by email or phone
    let student = null;
    if (importedLead.emailId) {
      student = await Student.findOne({ where: { email: importedLead.emailId } });
    }

    if (!student && importedLead.contactNumber) {
      student = await Student.findOne({ where: { phone: importedLead.contactNumber } });
    }

    if (!student) {
      const rawName = (importedLead.name || '').trim();
      const nameParts = rawName ? rawName.split(' ') : [];
      const firstName = nameParts[0] || 'Lead';
      const lastName = nameParts.slice(1).join(' ') || 'From Telecaller';

      let email = importedLead.emailId;
      if (!email) {
        // Fallback placeholder email (unique per imported lead)
        email = `telecaller_lead_${importedLead.id}_${Date.now()}@placeholder.local`;
      }

      student = await Student.create({
        firstName,
        lastName,
        email,
        phone: importedLead.contactNumber || '',
        counselorId: null,
        marketingOwnerId: telecallerId
      });
    }

    // Update imported lead metadata so it reflects that assignment is pending counselor acceptance
    await importedLead.update({
      assigned: counselor.name || String(counselorId),
      leadStatus: importedLead.leadStatus || 'ASSIGNMENT_PENDING'
    });

    // Push a lead assignment notification to the selected counselor (same pattern as marketing leads)
    
    // Create persistent notification in database
    const notificationData = {
      userId: counselor.id,
      type: 'lead_assignment',
      title: 'New Lead Assigned',
      message: `You have a new lead assignment request: ${student.firstName} ${student.lastName}`,
      priority: 'high',
      leadId: student.id,
      isRead: false
    };

    try {
      // Save notification to database
      const savedNotification = await Notification.create(notificationData);
      
      // Also push to Redis/WebSocket for real-time update
      const key = `notifications:${counselor.id}`;
      const existing = (await cacheUtils.get(key)) || [];
      existing.unshift(savedNotification.toJSON());
      await cacheUtils.set(key, existing, 3600);
      await webSocketService.sendNotification(counselor.id, savedNotification.toJSON());
    } catch (notifyError) {
      console.error('Failed to push telecaller lead assignment notification:', notifyError);
    }

    res.json({
      success: true,
      message: `Lead assignment request sent to counselor ${counselor.name} successfully`,
      data: {
        studentId: student.id
      }
    });
  } catch (error) {
    console.error('Error assigning telecaller imported lead to counselor (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign telecaller lead to counselor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const marketingControllers = createRoleControllers('marketing');
exports.getMarketingTeam = marketingControllers.list;
exports.addMarketingTeamMember = marketingControllers.create;
exports.updateMarketingTeamMemberStatus = marketingControllers.updateStatus;
exports.updateMarketingTeamMember = marketingControllers.update;
exports.deleteMarketingTeamMember = marketingControllers.remove;

const b2bMarketingControllers = createRoleControllers('b2b_marketing');
exports.getB2BMarketingTeam = b2bMarketingControllers.list;
exports.addB2BMarketingTeamMember = b2bMarketingControllers.create;
exports.updateB2BMarketingTeamMemberStatus = b2bMarketingControllers.updateStatus;
exports.updateB2BMarketingTeamMember = b2bMarketingControllers.update;
exports.deleteB2BMarketingTeamMember = b2bMarketingControllers.remove;

// Admin view: leads for a specific marketing team member (with filters)
exports.getMarketingMemberLeadsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      dateRange,
      startDate,
      endDate
    } = req.query || {};

    const member = await User.findOne({
      where: { id, role: 'marketing' },
      attributes: ['id', 'name', 'email', 'phone', 'active', 'createdAt']
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Marketing team member not found'
      });
    }

    const where = { marketingOwnerId: id };
    const orClauses = [];

    if (name && name.trim()) {
      const term = `%${name.trim()}%`;
      orClauses.push(
        { firstName: { [Op.like]: term } },
        { lastName: { [Op.like]: term } }
      );
    }

    if (email && email.trim()) {
      const term = `%${email.trim()}%`;
      orClauses.push({ email: { [Op.like]: term } });
    }

    if (phone && phone.trim()) {
      const term = `%${phone.trim()}%`;
      orClauses.push({ phone: { [Op.like]: term } });
    }

    if (orClauses.length) {
      where[Op.or] = orClauses;
    }

    // Date range filtering
    let start = null;
    let end = null;
    const now = new Date();

    if (dateRange === 'last_week') {
      end = now;
      start = new Date();
      start.setDate(end.getDate() - 7);
    } else if (dateRange === 'last_month') {
      end = now;
      start = new Date();
      start.setMonth(end.getMonth() - 1);
    } else if (dateRange === 'last_6_months') {
      end = now;
      start = new Date();
      start.setMonth(end.getMonth() - 6);
    } else if (dateRange === 'last_year') {
      end = now;
      start = new Date();
      start.setFullYear(end.getFullYear() - 1);
    } else if (dateRange === 'custom') {
      if (startDate) start = new Date(startDate);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    }

    if (start && !Number.isNaN(start.getTime())) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.gte] = start;
    }
    if (end && !Number.isNaN(end.getTime())) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.lte] = end;
    }

    const leads = await Student.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Get document counts for each lead
    const leadIds = leads.map(l => l.id);
    const documentCounts = await Document.findAll({
      where: {
        studentId: { [Op.in]: leadIds },
        type: { [Op.in]: ['ID_CARD', 'ENROLLMENT_LETTER', 'OTHER'] }
      },
      attributes: [
        'studentId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['studentId'],
      raw: true
    });

    const documentCountMap = {};
    documentCounts.forEach(doc => {
      documentCountMap[doc.studentId] = parseInt(doc.count, 10);
    });

    const data = leads.map((s) => ({
      id: s.id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed Lead',
      email: s.email,
      phone: s.phone,
      university: s.preferredUniversity || null,
      status: s.status,
      currentPhase: s.currentPhase,
      assigned: Boolean(s.counselorId),
      documentCount: documentCountMap[s.id] || 0,
      createdAt: s.createdAt
    }));

    res.json({
      success: true,
      data: {
        member,
        totalLeads: data.length,
        leads: data
      }
    });
  } catch (error) {
    console.error('Error fetching marketing member leads for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads for this marketing member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin view: leads for a specific B2B marketing team member (with filters)
exports.getB2BMarketingMemberLeadsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      dateRange,
      startDate,
      endDate
    } = req.query || {};

    const member = await User.findOne({
      where: { id, role: 'b2b_marketing' },
      attributes: ['id', 'name', 'email', 'phone', 'active', 'createdAt']
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'B2B marketing team member not found'
      });
    }

    const where = { marketingOwnerId: id };
    const orClauses = [];

    if (name && name.trim()) {
      const term = `%${name.trim()}%`;
      orClauses.push(
        { firstName: { [Op.like]: term } },
        { lastName: { [Op.like]: term } }
      );
    }

    if (email && email.trim()) {
      const term = `%${email.trim()}%`;
      orClauses.push({ email: { [Op.like]: term } });
    }

    if (phone && phone.trim()) {
      const term = `%${phone.trim()}%`;
      orClauses.push({ phone: { [Op.like]: term } });
    }

    if (orClauses.length) {
      where[Op.or] = orClauses;
    }

    // Date range filtering
    let start = null;
    let end = null;
    const now = new Date();

    if (dateRange === 'last_week') {
      end = now;
      start = new Date();
      start.setDate(end.getDate() - 7);
    } else if (dateRange === 'last_month') {
      end = now;
      start = new Date();
      start.setMonth(end.getMonth() - 1);
    } else if (dateRange === 'last_6_months') {
      end = now;
      start = new Date();
      start.setMonth(end.getMonth() - 6);
    } else if (dateRange === 'last_year') {
      end = now;
      start = new Date();
      start.setFullYear(end.getFullYear() - 1);
    } else if (dateRange === 'custom') {
      if (startDate) start = new Date(startDate);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    }

    if (start && !Number.isNaN(start.getTime())) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.gte] = start;
    }
    if (end && !Number.isNaN(end.getTime())) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.lte] = end;
    }

    const leads = await Student.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Get document counts for each lead
    const leadIds = leads.map(l => l.id);
    const documentCounts = await Document.findAll({
      where: {
        studentId: { [Op.in]: leadIds },
        type: { [Op.in]: ['ID_CARD', 'ENROLLMENT_LETTER', 'OTHER'] }
      },
      attributes: [
        'studentId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['studentId'],
      raw: true
    });

    const documentCountMap = {};
    documentCounts.forEach(doc => {
      documentCountMap[doc.studentId] = parseInt(doc.count, 10);
    });

    const data = leads.map((s) => ({
      id: s.id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed Lead',
      email: s.email,
      phone: s.phone,
      status: s.status,
      currentPhase: s.currentPhase,
      assigned: Boolean(s.counselorId),
      documentCount: documentCountMap[s.id] || 0,
      createdAt: s.createdAt
    }));

    res.json({
      success: true,
      data: {
        member,
        totalLeads: data.length,
        leads: data
      }
    });
  } catch (error) {
    console.error('Error fetching B2B marketing member leads for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads for this B2B marketing member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Download documents as zip for a specific lead
exports.downloadLeadDocuments = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    // Verify lead exists
    const lead = await Student.findOne({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get documents for this lead (ID_CARD, ENROLLMENT_LETTER, OTHER)
    const documents = await Document.findAll({
      where: {
        studentId: leadId,
        type: { [Op.in]: ['ID_CARD', 'ENROLLMENT_LETTER', 'OTHER'] }
      },
      order: [['type', 'ASC'], ['createdAt', 'DESC']]
    });

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No documents found for this lead'
      });
    }

    // Check if archiver is available
    let archiver;
    try {
      archiver = require('archiver');
    } catch (archiverError) {
      console.error('Archiver package not found. Please install it: npm install archiver');
      return res.status(500).json({
        success: false,
        message: 'Archiver package not installed. Please install it: npm install archiver'
      });
    }

    const DigitalOceanStorageService = require('../services/digitalOceanStorage');
    const fs = require('fs');
    const path = require('path');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="lead-${leadId}-documents.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error creating zip file'
        });
      }
    });

    archive.pipe(res);

    // Download each document and add to zip
    for (const doc of documents) {
      try {
        let fileBuffer;
        
        // Try to get file from DigitalOcean Spaces first
        try {
          const storageService = new DigitalOceanStorageService();
          fileBuffer = await storageService.downloadFile(doc.path);
        } catch (storageError) {
          console.log(`DigitalOcean download failed for ${doc.path}, trying local storage:`, storageError.message);
          
          // Fallback to local file system
          const possiblePaths = [
            doc.path,
            path.join(__dirname, '..', 'uploads', doc.path),
            path.join(__dirname, '..', 'uploads', 'marketing-documents', path.basename(doc.path)),
            path.join(process.cwd(), 'uploads', doc.path),
            path.join(process.cwd(), 'uploads', 'marketing-documents', path.basename(doc.path))
          ];
          
          let fileFound = false;
          for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
              fileBuffer = fs.readFileSync(filePath);
              fileFound = true;
              break;
            }
          }
          
          if (!fileFound) {
            console.error(`File not found for document ${doc.id} at path: ${doc.path}`);
            // Skip this document but continue with others
            continue;
          }
        }
        
        // Determine file extension from mimeType or name
        let extension = '';
        if (doc.mimeType) {
          if (doc.mimeType.includes('pdf')) extension = '.pdf';
          else if (doc.mimeType.includes('jpeg') || doc.mimeType.includes('jpg')) extension = '.jpg';
          else if (doc.mimeType.includes('png')) extension = '.png';
          else if (doc.mimeType.includes('word')) extension = '.docx';
          else if (doc.mimeType.includes('excel')) extension = '.xlsx';
        } else if (doc.name) {
          const extMatch = doc.name.match(/\.([^.]+)$/);
          if (extMatch) extension = extMatch[0];
        }
        
        // Use document name or generate one
        const fileName = doc.name || `${doc.type}${extension}`;
        
        archive.append(fileBuffer, { name: fileName });
      } catch (err) {
        console.error(`Error adding document ${doc.id} to zip:`, err);
        // Continue with other documents even if one fails
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error downloading lead documents:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to download documents',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

exports.getUniversities = async (req, res) => {
  try {
    const universities = await University.findAll({
      attributes: [
        'id',
        'name',
        'country',
        'city',
        'website',
        'ranking',
        'acceptanceRate',
        'description',
        'requirements',
        'active',
        'createdAt',
        'updatedAt',
        [
          Sequelize.fn('COUNT', Sequelize.col('applications.id')),
          'studentCount'
        ]
      ],
      include: [{
        model: StudentUniversityApplication,
        as: 'applications',
        attributes: [],
        required: false
      }],
      group: [
        'University.id',
        'University.name',
        'University.country',
        'University.city',
        'University.website',
        'University.ranking',
        'University.acceptanceRate',
        'University.description',
        'University.requirements',
        'University.active',
        'University.createdAt',
        'University.updatedAt'
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      message: 'Universities fetched successfully',
      data: universities.map(uni => ({
        ...uni.get({ plain: true }),
        studentCount: parseInt(uni.getDataValue('studentCount') || 0)
      }))
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch universities. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.addUniversity = async (req, res) => {
  try {
    const { name, country, requirements } = req.body;

    if (!name || !country) {
      return res.status(400).json({
        success: false,
        message: 'Name and country are required fields'
      });
    }

    const university = await University.create({
      name,
      country,
      requirements: requirements || null,
      active: true
    });

    res.status(201).json({
      success: true,
      message: 'University added successfully',
      data: university
    });
  } catch (error) {
    console.error('Error adding university:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add university. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, requirements, active } = req.body;

    const university = await University.findByPk(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    await university.update({
      name: name || university.name,
      country: country || university.country,
      requirements: requirements !== undefined ? requirements : university.requirements,
      active: active !== undefined ? active : university.active
    });

    res.json({
      success: true,
      message: 'University updated successfully',
      data: university
    });
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update university. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findByPk(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    const studentCount = await university.countStudents();
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete university with associated students. Consider deactivating instead.'
      });
    }

    await university.destroy();
    res.json({
      success: true,
      message: 'University deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete university. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const { search, phase, status, counselorId, page = 1, limit = 10 } = req.query;

    const where = {};
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
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (counselorId && counselorId !== '') {
      where.counselorId = parseInt(counselorId) || counselorId;
    }

    const { count, rows } = await Student.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'name']
        },
        {
          model: StudentUniversityApplication,
          as: 'applications',
          include: [{
            model: University,
            as: 'university',
            attributes: ['name']
          }]
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Students fetched successfully',
      data: {
        students: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load students. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.counselorId === '') {
      updateData.counselorId = null;
    }

    if (!updateData.firstName || !updateData.lastName || !updateData.email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (updateData.email !== student.email) {
      const existingStudent = await Student.findOne({ 
        where: { 
          email: updateData.email,
          id: { [Op.ne]: id } 
        } 
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    await student.update(updateData);

    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const { cacheUtils } = require('../config/redis');
const webSocketService = require('../services/websocketService');

// Admin: assign a lead (student) to a specific counselor
exports.assignLeadToCounselorAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { counselorId } = req.body || {};

    if (!counselorId) {
      return res.status(400).json({
        success: false,
        message: 'counselorId is required'
      });
    }

    const counselor = await User.findOne({
      where: { id: counselorId, role: 'counselor' },
      attributes: ['id', 'name', 'email']
    });

    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Lead (student) not found'
      });
    }

    // Do NOT assign immediately; wait for counselor acceptance.
    // Just notify the counselor about the pending assignment.
    
    // Create persistent notification in database
    const notificationData = {
      userId: counselor.id,
      type: 'lead_assignment',
      title: 'New Lead Assigned',
      message: `You have a new lead assignment request: ${student.firstName} ${student.lastName}`,
      priority: 'high',
      leadId: student.id,
      isRead: false
    };

    try {
      // Save notification to database
      const savedNotification = await Notification.create(notificationData);
      
      // Also push to Redis/WebSocket for real-time update
      const key = `notifications:${counselor.id}`;
      const existing = (await cacheUtils.get(key)) || [];
      existing.unshift(savedNotification.toJSON());
      await cacheUtils.set(key, existing, 3600);
      await webSocketService.sendNotification(counselor.id, savedNotification.toJSON());
    } catch (notifyError) {
      console.error('Failed to push assignment notification:', notifyError);
    }

    res.json({
      success: true,
      message: `Lead assigned to counselor ${counselor.name} successfully`
    });
  } catch (error) {
    console.error('Error assigning lead to counselor (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign lead to counselor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id']
        },
        {
          model: StudentUniversityApplication,
          as: 'applications',
          attributes: ['id']
        },
        {
          model: Note,
          as: 'studentNotes',
          attributes: ['id']
        },
        {
          model: Activity,
          as: 'studentActivities',
          attributes: ['id']
        },
        {
          model: Task,
          as: 'studentTasks',
          attributes: ['id']
        }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    const result = await sequelize.transaction(async (t) => {
      if (student.documents && student.documents.length > 0) {
        await Document.destroy({
          where: { studentId: id },
          transaction: t
        });
      }

      if (student.applications && student.applications.length > 0) {
        await StudentUniversityApplication.destroy({
          where: { studentId: id },
          transaction: t
        });
      }

      if (student.studentNotes && student.studentNotes.length > 0) {
        await Note.destroy({
          where: { studentId: id },
          transaction: t
        });
      }

      if (student.studentActivities && student.studentActivities.length > 0) {
        await Activity.destroy({
          where: { studentId: id },
          transaction: t
        });
      }

      if (student.studentTasks && student.studentTasks.length > 0) {
        await Task.destroy({
          where: { studentId: id },
          transaction: t
        });
      }

      await student.destroy({ transaction: t });
      return true;
    });

    res.json({
      success: true,
      message: 'Student and all related records deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = {
      emailNotifications: true,
      autoAssignment: false,
      documentTypes: [
        'Passport',
        'Academic Transcript',
        'IELTS/TOEFL Score',
        'CV/Resume',
        'Statement of Purpose',
        'Recommendation Letter',
        'Financial Documents'
      ],
      phases: Student.rawAttributes.currentPhase.values,
      statuses: Student.rawAttributes.status.values
    };

    res.json({
      success: true,
      message: 'Settings fetched successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load settings. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    const [
      studentStats,
      applicationStats,
      counselorPerformance,
      documentStats
    ] = await Promise.all([
      Student.findAll({
        attributes: [
          'currentPhase',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.between]: [start, end] }
        },
        group: ['currentPhase']
      }),

      StudentUniversityApplication.findAll({
        attributes: [
          'applicationStatus',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.between]: [start, end] }
        },
        group: ['applicationStatus']
      }),

      User.findAll({
        attributes: [
          'id',
          'name',
          [Sequelize.fn('COUNT', Sequelize.col('students.id')), 'totalStudents']
        ],
        where: { role: 'counselor' },
        include: [{
          model: Student,
          as: 'students',
          attributes: [],
          required: false,
          where: {
            createdAt: { [Op.between]: [start, end] }
          }
        }],
        group: ['User.id', 'User.name']
      }),

      Document.findAll({
        attributes: [
          'status',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.between]: [start, end] }
        },
        group: ['status']
      })
    ]);

    const responseData = {
      studentStats: studentStats.map(stat => ({
        ...stat.get({ plain: true }),
        count: parseInt(stat.getDataValue('count'))
      })),
      applicationStats: applicationStats.map(stat => ({
        ...stat.get({ plain: true }),
        count: parseInt(stat.getDataValue('count'))
      })),
      counselorPerformance: counselorPerformance.map(perf => ({
        ...perf.get({ plain: true }),
        totalStudents: parseInt(perf.getDataValue('totalStudents'))
      })),
      documentStats: documentStats.map(stat => ({
        ...stat.get({ plain: true }),
        count: parseInt(stat.getDataValue('count'))
      })),
      dateRange: { start, end }
    };
    res.json({
      success: true,
      message: 'Report data fetched successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load report data. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.exportReports = async (req, res) => {
  try {
    const { type, startDate, endDate, format = 'csv' } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    let data = [];
    let filename = '';

    switch (type) {
      case 'students':
        data = await Student.findAll({
          where: {
            createdAt: { [Op.between]: [start, end] }
          },
          include: [
            {
              model: User,
              as: 'counselor',
              attributes: ['name']
            }
          ],
          attributes: ['id', 'firstName', 'lastName', 'email', 'currentPhase', 'status', 'createdAt']
        });
        filename = `students_report_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`;
        break;

      case 'applications':
        data = await StudentUniversityApplication.findAll({
          where: {
            createdAt: { [Op.between]: [start, end] }
          },
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['firstName', 'lastName']
            },
            {
              model: University,
              as: 'university',
              attributes: ['name']
            }
          ],
          attributes: ['id', 'applicationStatus', 'programName', 'applicationDeadline', 'createdAt']
        });
        filename = `applications_report_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`;
        break;

      case 'counselors':
        data = await User.findAll({
          where: { role: 'counselor' },
          include: [{
            model: Student,
            as: 'students',
            attributes: [],
            required: false,
            where: {
              createdAt: { [Op.between]: [start, end] }
            }
          }],
          attributes: ['id', 'name', 'email', 'createdAt']
        });
        filename = `counselors_report_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`;
        break;

      case 'documents':
        data = await Document.findAll({
          where: {
            createdAt: { [Op.between]: [start, end] }
          },
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['firstName', 'lastName']
            }
          ],
          attributes: ['id', 'type', 'name', 'status', 'createdAt']
        });
        filename = `documents_report_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`;
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    if (format === 'csv') {
      const { createObjectCsvStringifier } = require('csv-writer');
      
      let headers = [];
      switch (type) {
        case 'students':
          headers = [
            { id: 'id', title: 'ID' },
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'email', title: 'Email' },
            { id: 'currentPhase', title: 'Current Phase' },
            { id: 'status', title: 'Status' },
            { id: 'counselor', title: 'Counselor' },
            { id: 'createdAt', title: 'Created At' }
          ];
          break;
        case 'applications':
          headers = [
            { id: 'id', title: 'ID' },
            { id: 'student', title: 'Student' },
            { id: 'university', title: 'University' },
            { id: 'programName', title: 'Program' },
            { id: 'applicationStatus', title: 'Status' },
            { id: 'applicationDeadline', title: 'Deadline' },
            { id: 'createdAt', title: 'Created At' }
          ];
          break;
        case 'counselors':
          headers = [
            { id: 'id', title: 'ID' },
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
            { id: 'totalStudents', title: 'Total Students' },
            { id: 'createdAt', title: 'Created At' }
          ];
          break;
        case 'documents':
          headers = [
            { id: 'id', title: 'ID' },
            { id: 'type', title: 'Type' },
            { id: 'name', title: 'Name' },
            { id: 'status', title: 'Status' },
            { id: 'student', title: 'Student' },
            { id: 'createdAt', title: 'Created At' }
          ];
          break;
      }

      const csvStringifier = createObjectCsvStringifier({ header: headers });
      
      const records = data.map(item => {
        const plainItem = item.get({ plain: true });
        switch (type) {
          case 'students':
            return {
              ...plainItem,
              counselor: plainItem.counselor?.name || 'N/A'
            };
          case 'applications':
            return {
              ...plainItem,
              student: `${plainItem.student?.firstName} ${plainItem.student?.lastName}`,
              university: plainItem.university?.name || 'N/A'
            };
          case 'counselors':
            return {
              ...plainItem,
              totalStudents: plainItem.students?.length || 0
            };
          case 'documents':
            return {
              ...plainItem,
              student: `${plainItem.student?.firstName} ${plainItem.student?.lastName}`
            };
          default:
            return plainItem;
        }
      });

      const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get deleted records
exports.getDeletedRecords = async (req, res) => {
  try {
    const { recordType, deletedByRole, page = 1, limit = 10 } = req.query;
    
    const where = {};
    
    if (recordType && recordType !== 'all') {
      where.recordType = recordType;
    }
    
    if (deletedByRole && deletedByRole !== 'all') {
      where.deletedByRole = deletedByRole;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await DeletedRecord.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'deleter',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['deletedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get statistics
    const stats = await DeletedRecord.findAll({
      attributes: [
        'recordType',
        'deletedByRole',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['recordType', 'deletedByRole'],
      raw: true
    });

    const statistics = {
      total: count,
      byType: {},
      byRole: {}
    };

    stats.forEach(stat => {
      if (!statistics.byType[stat.recordType]) {
        statistics.byType[stat.recordType] = 0;
      }
      if (!statistics.byRole[stat.deletedByRole]) {
        statistics.byRole[stat.deletedByRole] = 0;
      }
      statistics.byType[stat.recordType] += parseInt(stat.count);
      statistics.byRole[stat.deletedByRole] += parseInt(stat.count);
    });

    res.json({
      success: true,
      message: 'Deleted records fetched successfully',
      data: {
        records: rows,
        statistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching deleted records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Restore deleted record
exports.restoreDeletedRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const adminId = req.user.id;
    
    console.log('Restore request:', { recordId, adminId });
    
    // Find the deleted record
    const deletedRecord = await DeletedRecord.findByPk(recordId, {
      include: [{
        model: User,
        as: 'deleter',
        attributes: ['id', 'name', 'email', 'role']
      }]
    });
    
    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Deleted record not found'
      });
    }
    
    // Check if record is still within retention period
    if (new Date() > new Date(deletedRecord.retentionUntil)) {
      return res.status(400).json({
        success: false,
        message: 'Record cannot be restored as it has exceeded the retention period'
      });
    }
    
    const recordData = deletedRecord.recordData;
    let restoredRecord = null;
    
    try {
      // Restore based on record type
      if (deletedRecord.recordType === 'student') {
        // Restore student record
        const { Student } = require('../models');
        
        // Check if a student with this ID already exists
        const existingStudent = await Student.findByPk(deletedRecord.recordId);
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'A student with this ID already exists. Cannot restore duplicate record.'
          });
        }
        
        // Create the student record
        restoredRecord = await Student.create({
          ...recordData,
          id: deletedRecord.recordId, // Restore original ID
          createdAt: recordData.createdAt,
          updatedAt: new Date()
        });
        
        // Restore related records if they exist
        if (recordData.documents && recordData.documents.length > 0) {
          const { Document } = require('../models');
          for (const doc of recordData.documents) {
            await Document.create({
              ...doc,
              studentId: restoredRecord.id,
              createdAt: doc.createdAt,
              updatedAt: new Date()
            });
          }
        }
        
        if (recordData.applications && recordData.applications.length > 0) {
          const { StudentUniversityApplication } = require('../models');
          for (const app of recordData.applications) {
            await StudentUniversityApplication.create({
              ...app,
              studentId: restoredRecord.id,
              createdAt: app.createdAt,
              updatedAt: new Date()
            });
          }
        }
        
      } else if (deletedRecord.recordType === 'counselor') {
        // Restore counselor (User) record
        const { User } = require('../models');
        
        // Check if a user with this ID already exists
        const existingUser = await User.findByPk(deletedRecord.recordId);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'A user with this ID already exists. Cannot restore duplicate record.'
          });
        }
        
        // Create the user record
        restoredRecord = await User.create({
          ...recordData,
          id: deletedRecord.recordId, // Restore original ID
          createdAt: recordData.createdAt,
          updatedAt: new Date()
        });
        
        // Restore related students if they exist
        if (recordData.students && recordData.students.length > 0) {
          const { Student } = require('../models');
          for (const student of recordData.students) {
            await Student.create({
              ...student,
              counselorId: restoredRecord.id,
              createdAt: student.createdAt,
              updatedAt: new Date()
            });
          }
        }
      }
      
      // Remove the deleted record from DeletedRecord table
      await deletedRecord.destroy();
      
      // Log the restoration activity
      const { Activity } = require('../models');
      await Activity.create({
        userId: adminId,
        action: 'restore_deleted_record',
        details: {
          recordType: deletedRecord.recordType,
          recordId: deletedRecord.recordId,
          restoredBy: req.user.name,
          originalDeleter: deletedRecord.deleter?.name,
          deletionDate: deletedRecord.deletedAt
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Broadcast activity update
      const webSocketService = require('../services/websocketService');
      webSocketService.broadcastToRoom('admin:all', 'admin_activity_update', {
        userId: adminId,
        userName: req.user.name,
        action: 'restore_deleted_record',
        details: {
          recordType: deletedRecord.recordType,
          recordId: deletedRecord.recordId
        }
      });
      
      res.json({
        success: true,
        message: `${deletedRecord.recordType} record restored successfully`,
        data: {
          restoredRecord,
          recordType: deletedRecord.recordType,
          originalDeleter: deletedRecord.deleter?.name,
          deletionDate: deletedRecord.deletedAt,
          restorationDate: new Date()
        }
      });
      
    } catch (restoreError) {
      console.error('Error during restoration:', restoreError);
      
      // If restoration fails, log the error but don't delete the deleted record
      res.status(500).json({
        success: false,
        message: 'Failed to restore record. The record data may be corrupted or incompatible.',
        error: process.env.NODE_ENV === 'development' ? restoreError.message : undefined
      });
    }
    
  } catch (error) {
    console.error('Error restoring deleted record:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring deleted record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk restore deleted records
exports.bulkRestoreDeletedRecords = async (req, res) => {
  try {
    const { recordIds } = req.body;
    const adminId = req.user.id;
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of record IDs to restore'
      });
    }
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    for (const recordId of recordIds) {
      try {
        const deletedRecord = await DeletedRecord.findByPk(recordId);
        
        if (!deletedRecord) {
          results.failed.push({
            recordId,
            reason: 'Record not found'
          });
          continue;
        }
        
        // Check retention period
        if (new Date() > new Date(deletedRecord.retentionUntil)) {
          results.skipped.push({
            recordId,
            reason: 'Exceeded retention period'
          });
          continue;
        }
        
        // Check for existing records
        let existingRecord = null;
        if (deletedRecord.recordType === 'student') {
          const { Student } = require('../models');
          existingRecord = await Student.findByPk(deletedRecord.recordId);
        } else if (deletedRecord.recordType === 'counselor') {
          const { User } = require('../models');
          existingRecord = await User.findByPk(deletedRecord.recordId);
        }
        
        if (existingRecord) {
          results.skipped.push({
            recordId,
            reason: 'Record already exists'
          });
          continue;
        }
        
        // Restore the record (simplified version for bulk restore)
        const recordData = deletedRecord.recordData;
        let restoredRecord = null;
        
        if (deletedRecord.recordType === 'student') {
          const { Student } = require('../models');
          restoredRecord = await Student.create({
            ...recordData,
            id: deletedRecord.recordId,
            createdAt: recordData.createdAt,
            updatedAt: new Date()
          });
        } else if (deletedRecord.recordType === 'counselor') {
          const { User } = require('../models');
          restoredRecord = await User.create({
            ...recordData,
            id: deletedRecord.recordId,
            createdAt: recordData.createdAt,
            updatedAt: new Date()
          });
        }
        
        // Remove from deleted records
        await deletedRecord.destroy();
        
        results.successful.push({
          recordId,
          recordType: deletedRecord.recordType,
          restoredRecord
        });
        
      } catch (error) {
        results.failed.push({
          recordId,
          reason: error.message
        });
      }
    }
    
    // Log bulk restoration activity
    const { Activity } = require('../models');
    await Activity.create({
      userId: adminId,
      action: 'bulk_restore_deleted_records',
      details: {
        totalRequested: recordIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: `Bulk restoration completed. ${results.successful.length} records restored successfully.`,
      data: results
    });
    
  } catch (error) {
    console.error('Error in bulk restore:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk restore',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports; 