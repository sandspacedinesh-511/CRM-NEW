const { User, CounselorActivity, Student, Document, Application, Note } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { format, subDays, startOfDay, endOfDay, differenceInSeconds } = require('date-fns');

// Track counselor activity
const trackActivity = async (counselorId, activityType, description = null, metadata = {}) => {
  try {
    const activityData = {
      counselorId,
      activityType,
      description,
      metadata,
      status: 'ACTIVE'
    };

    // Handle login activity
    if (activityType === 'LOGIN') {
      activityData.loginTime = metadata.loginTime || new Date();
      activityData.ipAddress = metadata.ipAddress;
      activityData.userAgent = metadata.userAgent;
      activityData.sessionId = metadata.sessionId;
    }

    // Handle logout activity
    if (activityType === 'LOGOUT') {
      activityData.logoutTime = metadata.logoutTime || new Date();
      activityData.ipAddress = metadata.ipAddress;
      activityData.userAgent = metadata.userAgent;
      activityData.sessionId = metadata.sessionId;
      
      // Find and update the corresponding login activity
      const loginActivity = await CounselorActivity.findOne({
        where: {
          counselorId,
          activityType: 'LOGIN',
          sessionId: metadata.sessionId,
          status: 'ACTIVE'
        },
        order: [['createdAt', 'DESC']]
      });

      if (loginActivity) {
        const sessionDuration = Math.floor((new Date(activityData.logoutTime) - new Date(loginActivity.loginTime)) / 1000);
        await loginActivity.update({
          logoutTime: activityData.logoutTime,
          sessionDuration,
          status: 'COMPLETED'
        });
      }
    }

    await CounselorActivity.create(activityData);
  } catch (error) {
    console.error('Error tracking counselor activity:', error);
  }
};

// Get counselor monitoring dashboard data
const getCounselorMonitoringData = async (req, res) => {
  try {
    const { 
      startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate = format(new Date(), 'yyyy-MM-dd'),
      counselorId = null,
      activityType = null
    } = req.query;

    const whereClause = {
      createdAt: {
        [Op.between]: [startOfDay(new Date(startDate)), endOfDay(new Date(endDate))]
      }
    };

    if (counselorId) {
      whereClause.counselorId = counselorId;
    }

    if (activityType) {
      whereClause.activityType = activityType;
    }

    // Get all counselors
    const counselors = await User.findAll({
      where: { role: 'counselor' },
      attributes: ['id', 'name', 'email', 'active', 'createdAt'],
      include: [
        {
          model: CounselorActivity,
          as: 'activities',
          where: whereClause,
          required: false,
          attributes: ['id', 'activityType', 'createdAt', 'sessionDuration', 'status']
        }
      ]
    });

    // Get activity statistics
    const activityStats = await CounselorActivity.findAll({
      where: whereClause,
      attributes: [
        'activityType',
        [sequelize.fn('COUNT', sequelize.col('CounselorActivity.id')), 'count'],
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date']
      ],
      group: ['activityType', sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    // Get session statistics with detailed timing information
    const sessionStats = await CounselorActivity.findAll({
      where: {
        ...whereClause,
        activityType: 'LOGIN'
      },
      attributes: [
        'counselorId',
        [sequelize.fn('COUNT', sequelize.col('CounselorActivity.id')), 'loginCount'],
        [sequelize.fn('AVG', sequelize.col('sessionDuration')), 'avgSessionDuration'],
        [sequelize.fn('SUM', sequelize.col('sessionDuration')), 'totalSessionDuration'],
        [sequelize.fn('MIN', sequelize.col('loginTime')), 'firstLogin'],
        [sequelize.fn('MAX', sequelize.col('loginTime')), 'lastLogin'],
        [sequelize.fn('MAX', sequelize.col('logoutTime')), 'lastLogout']
      ],
      group: ['counselorId'],
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['name', 'email']
        }
      ]
    });

    // Get recent activities
    const recentActivities = await CounselorActivity.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Calculate summary statistics
    const totalActivities = await CounselorActivity.count({ where: whereClause });
    const uniqueCounselors = await CounselorActivity.count({
      where: whereClause,
      distinct: true,
      col: 'counselorId'
    });

    const activeSessions = await CounselorActivity.count({
      where: {
        ...whereClause,
        activityType: 'LOGIN',
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      data: {
        counselors,
        activityStats,
        sessionStats,
        recentActivities,
        summary: {
          totalActivities,
          uniqueCounselors,
          activeSessions,
          dateRange: { startDate, endDate }
        }
      }
    });

  } catch (error) {
    console.error('Error getting counselor monitoring data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get counselor monitoring data',
      error: error.message
    });
  }
};

// Get detailed counselor activity
const getCounselorActivityDetails = async (req, res) => {
  try {
    const { counselorId } = req.params;
    const { 
      startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      endDate = format(new Date(), 'yyyy-MM-dd'),
      activityType = null
    } = req.query;

    const whereClause = {
      counselorId,
      createdAt: {
        [Op.between]: [startOfDay(new Date(startDate)), endOfDay(new Date(endDate))]
      }
    };

    if (activityType) {
      whereClause.activityType = activityType;
    }

    // Get counselor details
    const counselor = await User.findByPk(counselorId, {
      attributes: ['id', 'name', 'email', 'active', 'createdAt'],
      include: [
        {
          model: Student,
          as: 'students',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }

    // Get activities
    const activities = await CounselorActivity.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Get activity breakdown
    const activityBreakdown = await CounselorActivity.findAll({
      where: whereClause,
      attributes: [
        'activityType',
        [sequelize.fn('COUNT', sequelize.col('CounselorActivity.id')), 'count']
      ],
      group: ['activityType']
    });

    // Get detailed session data
    const sessions = await CounselorActivity.findAll({
      where: {
        counselorId,
        activityType: 'LOGIN',
        createdAt: {
          [Op.between]: [startOfDay(new Date(startDate)), endOfDay(new Date(endDate))]
        }
      },
      attributes: [
        'id',
        'loginTime',
        'logoutTime',
        'sessionDuration',
        'createdAt',
        'status',
        'ipAddress',
        'userAgent'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get logout activities for this counselor
    const logoutActivities = await CounselorActivity.findAll({
      where: {
        counselorId,
        activityType: 'LOGOUT',
        createdAt: {
          [Op.between]: [startOfDay(new Date(startDate)), endOfDay(new Date(endDate))]
        }
      },
      attributes: ['id', 'logoutTime', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // Calculate detailed session statistics
    const sessionStats = {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((sum, session) => sum + (session.sessionDuration || 0), 0),
      avgDuration: sessions.length > 0 ? 
        sessions.reduce((sum, session) => sum + (session.sessionDuration || 0), 0) / sessions.length : 0,
      firstLogin: sessions.length > 0 ? Math.min(...sessions.map(s => s.loginTime || s.createdAt)) : null,
      lastLogin: sessions.length > 0 ? Math.max(...sessions.map(s => s.loginTime || s.createdAt)) : null,
      lastLogout: logoutActivities.length > 0 ? Math.max(...logoutActivities.map(s => s.logoutTime || s.createdAt)) : null,
      activeSessions: sessions.filter(s => s.status === 'ACTIVE').length,
      completedSessions: sessions.filter(s => s.status === 'COMPLETED').length
    };

    // Calculate current session duration for active sessions
    const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
    const currentSessionDuration = activeSessions.length > 0 ? 
      Math.floor((new Date() - new Date(activeSessions[0].loginTime || activeSessions[0].createdAt)) / 1000) : 0;
    
    sessionStats.currentSessionDuration = currentSessionDuration;

    res.json({
      success: true,
      data: {
        counselor,
        activities,
        activityBreakdown,
        sessions,
        sessionStats
      }
    });

  } catch (error) {
    console.error('Error getting counselor activity details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get counselor activity details',
      error: error.message
    });
  }
};

// Get real-time activity feed
const getRealTimeActivityFeed = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await CounselorActivity.findAll({
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Error getting real-time activity feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time activity feed',
      error: error.message
    });
  }
};

// Export counselor activity data
const exportCounselorActivity = async (req, res) => {
  try {
    const { 
      startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate = format(new Date(), 'yyyy-MM-dd'),
      counselorId = null
    } = req.query;

    const whereClause = {
      createdAt: {
        [Op.between]: [startOfDay(new Date(startDate)), endOfDay(new Date(endDate))]
      }
    };

    if (counselorId) {
      whereClause.counselorId = counselorId;
    }

    const activities = await CounselorActivity.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Convert to CSV format
    const csvData = activities.map(activity => ({
      'Counselor Name': activity.counselor?.name || 'Unknown',
      'Counselor Email': activity.counselor?.email || 'Unknown',
      'Activity Type': activity.activityType,
      'Description': activity.description || '',
      'IP Address': activity.ipAddress || '',
      'Session Duration (seconds)': activity.sessionDuration || '',
      'Status': activity.status,
      'Created At': format(new Date(activity.createdAt), 'yyyy-MM-dd HH:mm:ss')
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="counselor_activity_${startDate}_to_${endDate}.csv"`);

    // Convert to CSV string
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    res.send(csvString);

  } catch (error) {
    console.error('Error exporting counselor activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export counselor activity data',
      error: error.message
    });
  }
};

module.exports = {
  trackActivity,
  getCounselorMonitoringData,
  getCounselorActivityDetails,
  getRealTimeActivityFeed,
  exportCounselorActivity
};
