const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const { User } = require('../models');
const webSocketService = require('../services/websocketService');

// Get all events (admin only)
router.get('/events', auth, checkRole(['admin']), async (req, res) => {
  try {
    let events = await cacheUtils.get('all_events') || [];
    
    // If no events in cache, provide some sample events based on real users
    if (events.length === 0) {
      const users = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'name', 'email'],
        limit: 1
      });

      events = [
        {
          id: 1,
          title: 'Monthly Team Meeting',
          description: 'Monthly team meeting to discuss progress and upcoming tasks',
          type: 'meeting',
          priority: 'high',
          targetAudience: 'all',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          location: 'Conference Room A',
          isActive: true,
          createdBy: users[0]?.id || req.user.id,
          createdByName: users[0]?.name || req.user.name,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Training Session: New Features',
          description: 'Training session for counselors on new system features',
          type: 'training',
          priority: 'medium',
          targetAudience: 'counselor',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          location: 'Training Room',
          isActive: true,
          createdBy: users[0]?.id || req.user.id,
          createdByName: users[0]?.name || req.user.name,
          createdAt: new Date().toISOString()
        }
      ];
      
      // Store the events in cache for future use
      await cacheUtils.set('all_events', events, 86400); // 24 hours TTL
    }
    
    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Create new event (admin only)
router.post('/events', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { title, description, type, priority, targetAudience, startTime, endTime, location, isActive } = req.body;
    
    const event = {
      id: Date.now().toString(),
      title,
      description,
      type,
      priority,
      targetAudience,
      startTime,
      endTime,
      location,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    };
    
    // Store event in cache
    const events = await cacheUtils.get('all_events') || [];
    events.unshift(event);
    await cacheUtils.set('all_events', events, 86400); // 24 hours TTL
    
    // Send real-time notification via WebSocket
    await webSocketService.broadcastToRoom('role:counselor', 'event_created', event);
    
    res.json({
      success: true,
      message: 'Event created successfully',
      event: event
    });
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// Get events for counselors
router.get('/my-events', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { type, priority, limit = 50 } = req.query;
    
    let events = await cacheUtils.get('all_events') || [];
    
    // If no events in cache, provide mock data for development
    if (events.length === 0) {
      events = [
        {
          id: 1,
          title: 'Monthly Team Meeting',
          description: 'Regular monthly team meeting to discuss progress and upcoming tasks.',
          type: 'meeting',
          priority: 'high',
          targetAudience: 'all',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          location: 'Conference Room A',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Training Session: New Features',
          description: 'Training session for counselors on new system features.',
          type: 'training',
          priority: 'medium',
          targetAudience: 'counselor',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          location: 'Training Room',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: 'System Maintenance',
          description: 'Scheduled system maintenance window.',
          type: 'maintenance',
          priority: 'high',
          targetAudience: 'all',
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Online',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
    
    // Filter events for this user based on targetAudience and userRole
    events = events.filter(event => {
      if (event.targetAudience === 'all') return true;
      if (event.targetAudience === userRole) return true;
      if (event.targetAudience === 'counselors' && userRole === 'counselor') return true;
      return false;
    });
    
    // Filter by type if specified
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    // Filter by priority if specified
    if (priority) {
      events = events.filter(event => event.priority === priority);
    }
    
    // Sort by start time (upcoming first)
    events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Limit results
    events = events.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    logger.error('Error fetching user events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Update event (admin only)
router.put('/events/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    const updates = req.body;
    
    let events = await cacheUtils.get('all_events') || [];
    const eventIndex = events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    events[eventIndex] = { ...events[eventIndex], ...updates, updatedAt: new Date().toISOString() };
    await cacheUtils.set('all_events', events, 86400);
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: events[eventIndex]
    });
  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// Delete event (admin only)
router.delete('/events/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const eventId = req.params.id;
    
    let events = await cacheUtils.get('all_events') || [];
    events = events.filter(event => event.id !== eventId);
    await cacheUtils.set('all_events', events, 86400);
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

module.exports = router;
