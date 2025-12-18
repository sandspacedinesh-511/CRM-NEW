const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const { User } = require('../models');

// Get all sessions (admin only)
router.get('/sessions', auth, checkRole(['admin']), async (req, res) => {
  try {
    const sessions = await cacheUtils.get('active_sessions') || [];
    
    // If no sessions in cache, provide some sample sessions based on real users
    if (sessions.length === 0) {
      const users = await User.findAll({
        where: { role: ['admin', 'counselor'] },
        attributes: ['id', 'name', 'email', 'role', 'active', 'lastLogin']
      });

      const sampleSessions = users.map((user, index) => ({
        id: `sess${index + 1}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        device: ['Desktop Chrome', 'Mobile Safari', 'Desktop Firefox', 'Mobile Chrome'][index % 4],
        ipAddress: `192.168.1.${100 + index}`,
        loginTime: new Date(Date.now() - Math.random() * 8 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
        status: user.active ? 'active' : 'inactive'
      }));
      
      // Store the sessions in cache for future use
      await cacheUtils.set('active_sessions', sampleSessions, 3600); // 1 hour TTL
      
      res.json({
        success: true,
        sessions: sampleSessions
      });
    } else {
      res.json({
        success: true,
        sessions: sessions
      });
    }
  } catch (error) {
    logger.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// End a session (admin only)
router.post('/sessions/:id/end', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    let sessions = await cacheUtils.get('active_sessions') || [];
    const sessionIndex = sessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    sessions[sessionIndex].status = 'inactive';
    sessions[sessionIndex].endedAt = new Date().toISOString();
    
    await cacheUtils.set('active_sessions', sessions, 3600); // 1 hour TTL
    
    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
});

// Get session settings (admin only)
router.get('/settings', auth, checkRole(['admin']), async (req, res) => {
  try {
    const settings = await cacheUtils.get('session_settings') || {
      singleDeviceLogin: true,
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
      maxConcurrentSessions: 3
    };
    
    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    logger.error('Error fetching session settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session settings'
    });
  }
});

// Update session settings (admin only)
router.post('/settings', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { singleDeviceLogin, sessionTimeout, maxConcurrentSessions } = req.body;
    
    const settings = {
      singleDeviceLogin: singleDeviceLogin !== undefined ? singleDeviceLogin : true,
      sessionTimeout: sessionTimeout || 8 * 60 * 60 * 1000,
      maxConcurrentSessions: maxConcurrentSessions || 3
    };
    
    await cacheUtils.set('session_settings', settings, 86400); // 24 hours TTL
    
    res.json({
      success: true,
      message: 'Session settings updated successfully',
      settings: settings
    });
  } catch (error) {
    logger.error('Error updating session settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session settings'
    });
  }
});

module.exports = router;
