const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const webSocketService = require('../services/websocketService');

// Debug route to test authentication
router.get('/debug', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working',
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// Get all alerts (admin only)
router.get('/alerts', auth, checkRole(['admin']), async (req, res) => {
  try {
    const alerts = await cacheUtils.get('all_alerts') || [];
    
    // If no alerts in cache, provide mock data for development
    if (alerts.length === 0) {
      const mockAlerts = [
        {
          id: 1,
          title: 'System Maintenance Scheduled',
          message: 'The system will be under maintenance on Sunday from 2 AM to 4 AM.',
          type: 'system',
          priority: 'high',
          targetAudience: 'all',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        },
        {
          id: 2,
          title: 'New Feature Available',
          message: 'The new student tracking feature is now available for all counselors.',
          type: 'feature',
          priority: 'medium',
          targetAudience: 'counselor',
          scheduledTime: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'admin'
        }
      ];
      
      res.json({
        success: true,
        alerts: mockAlerts
      });
    } else {
      res.json({
        success: true,
        alerts: alerts
      });
    }
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

// Create alert/reminder
router.post('/create', auth, async (req, res) => {
  try {
    const { title, message, type, priority, targetUsers, targetAudience, scheduledTime, recurring } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }
    
    const alert = {
      id: Date.now().toString(),
      title,
      message,
      type: type || 'general',
      priority: priority || 'medium',
      targetUsers: targetUsers || [],
      targetAudience: targetAudience || 'all',
      scheduledTime: scheduledTime || new Date().toISOString(),
      recurring: recurring || false,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      createdByName: req.user.name
    };
    
    // Store alert in cache
    const alerts = await cacheUtils.get('all_alerts') || [];
    alerts.unshift(alert);
    await cacheUtils.set('all_alerts', alerts, 86400); // 24 hours TTL
    
    // Send real-time notification via WebSocket
    await webSocketService.sendAdminAlert(alert);
    
    res.json({
      success: true,
      message: 'Alert created and sent successfully',
      alert: alert
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert'
    });
  }
});

// Get user alerts (counselor/admin)
router.get('/my-alerts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { type, priority, limit = 50 } = req.query;
    
    let alerts = await cacheUtils.get('all_alerts') || [];
    
    // If no alerts in cache, provide mock data for development
    if (alerts.length === 0) {
      alerts = [
        {
          id: 1,
          title: 'Welcome to the System',
          message: 'Welcome to your counselor dashboard. Please review the new features available.',
          type: 'system',
          priority: 'high',
          targetAudience: 'all',
          scheduledTime: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Training Session Tomorrow',
          message: 'Don\'t forget about the training session tomorrow at 2 PM.',
          type: 'training',
          priority: 'medium',
          targetAudience: 'counselor',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
    
    // Filter alerts for this user based on targetAudience and userRole
    alerts = alerts.filter(alert => {
      if (alert.targetAudience === 'all') return true;
      if (alert.targetAudience === userRole) return true;
      if (alert.targetAudience === 'counselors' && userRole === 'counselor') return true;
      if (alert.targetUsers && alert.targetUsers.length > 0) {
        return alert.targetUsers.includes(userId);
      }
      return false;
    });
    
    // Filter by type if specified
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    // Filter by priority if specified
    if (priority) {
      alerts = alerts.filter(alert => alert.priority === priority);
    }
    
    // Sort by scheduled time (newest first)
    alerts.sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime));
    
    // Limit results
    alerts = alerts.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    logger.error('Error fetching user alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

// Update alert status
router.put('/alerts/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const alertId = req.params.id;
    const updates = req.body;
    
    let alerts = await cacheUtils.get('all_alerts') || [];
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    alerts[alertIndex] = { ...alerts[alertIndex], ...updates, updatedAt: new Date().toISOString() };
    await cacheUtils.set('all_alerts', alerts, 86400);
    
    res.json({
      success: true,
      message: 'Alert updated successfully',
      alert: alerts[alertIndex]
    });
  } catch (error) {
    logger.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert'
    });
  }
});

// Delete alert
router.delete('/alerts/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const alertId = req.params.id;
    
    let alerts = await cacheUtils.get('all_alerts') || [];
    alerts = alerts.filter(alert => alert.id !== alertId);
    await cacheUtils.set('all_alerts', alerts, 86400);
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert'
    });
  }
});

module.exports = router;
