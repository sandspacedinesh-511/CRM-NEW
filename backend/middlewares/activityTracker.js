const { CounselorActivity } = require('../models');
const { trackActivity } = require('../controllers/counselorMonitoringController');

// Middleware to track counselor activities
const trackCounselorActivity = (activityType, description = null) => {
  return async (req, res, next) => {
    try {
      // Only track activities for counselors
      if (req.user && req.user.role === 'counselor') {
        const metadata = {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          sessionId: req.session?.id,
          url: req.originalUrl,
          method: req.method
        };

        // Add request body for certain activities
        if (['DOCUMENT_UPLOAD', 'STUDENT_EDIT', 'APPLICATION_CREATE', 'APPLICATION_EDIT'].includes(activityType)) {
          metadata.requestData = req.body;
        }

        // Track the activity
        await trackActivity(req.user.id, activityType, description, metadata);
      }
    } catch (error) {
      // Don't block the request if tracking fails
    }
    
    next();
  };
};

// Middleware to track login/logout
const trackLoginActivity = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'counselor') {
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.session?.id,
        loginTime: new Date()
      };

      await trackActivity(req.user.id, 'LOGIN', `Counselor ${req.user.name} logged in`, metadata);
    }
  } catch (error) {
    // Error tracking login activity
  }
  
  next();
};

const trackLogoutActivity = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'counselor') {
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.session?.id,
        logoutTime: new Date()
      };

      await trackActivity(req.user.id, 'LOGOUT', `Counselor ${req.user.name} logged out`, metadata);
    }
  } catch (error) {
    // Error tracking logout activity
  }
  
  next();
};

// Middleware to track session duration
const trackSessionDuration = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'counselor') {
      // Find the last login activity for this session
      const lastLogin = await CounselorActivity.findOne({
        where: {
          counselorId: req.user.id,
          activityType: 'LOGIN',
          sessionId: req.session?.id,
          status: 'ACTIVE'
        },
        order: [['createdAt', 'DESC']]
      });

      if (lastLogin) {
        const sessionDuration = Math.floor((new Date() - new Date(lastLogin.createdAt)) / 1000);
        
        // Update the login activity with session duration
        await lastLogin.update({
          sessionDuration,
          status: 'COMPLETED'
        });
      }
    }
  } catch (error) {
    // Error tracking session duration
  }
  
  next();
};

module.exports = {
  trackCounselorActivity,
  trackLoginActivity,
  trackLogoutActivity,
  trackSessionDuration
};
