const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const webSocketService = require('../services/websocketService');
const { Notification } = require('../models');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Fetch notifications from database
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const unreadCount = await Notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      total: count
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Update in database
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { id: notificationId, userId } }
    );

    if (updated) {
      // Also update cache if exists
      try {
        const key = `notifications:${userId}`;
        const cached = await cacheUtils.get(key);
        if (cached) {
          const updatedCached = cached.map(n =>
            n.id == notificationId ? { ...n, isRead: true } : n
          );
          await cacheUtils.set(key, updatedCached, 3600);
        }
      } catch (cacheError) {
        // Ignore cache errors
      }
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Update in database
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    // Update cache
    try {
      const key = `notifications:${userId}`;
      const cached = await cacheUtils.get(key);
      if (cached) {
        const updatedCached = cached.map(n => ({ ...n, isRead: true }));
        await cacheUtils.set(key, updatedCached, 3600);
      }
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Create notification (admin only)
router.post('/create', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { userId, type, title, message, priority = 'medium' } = req.body;

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      priority,
      isRead: false
    });

    // Store notification in cache
    try {
      const key = `notifications:${userId}`;
      const existing = await cacheUtils.get(key) || [];
      existing.unshift(notification.toJSON());
      await cacheUtils.set(key, existing, 3600);
    } catch (cacheError) {
      // Ignore
    }

    // Send real-time notification via WebSocket
    await webSocketService.sendNotification(userId, notification);

    res.json({
      success: true,
      message: 'Notification created and sent',
      notification
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Send system-wide notification (admin only)
router.post('/broadcast', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { type, title, message, priority = 'medium', targetRole } = req.body;

    // Note: Broadcasts might be hard to persist for everyone efficiently without a separate Broadcast model or creating N records.
    // For now, we'll just send via WebSocket and maybe not persist them individually in this simple implementation,
    // OR we could iterate and create. For simplicity/performance, we might skip persistence for broadcast or handle it differently.
    // But the requirement was about lead sharing, which is 1-to-1.
    // I'll leave broadcast as ephemeral for now unless requested otherwise, or just send via WS.

    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority
    };

    // Send to all users or specific role
    if (targetRole) {
      webSocketService.broadcastToRoom(`role:${targetRole}`, 'notification', notification);
    } else {
      webSocketService.broadcastToAll('notification', notification);
    }

    res.json({
      success: true,
      message: 'Notification broadcasted',
      notification
    });
  } catch (error) {
    logger.error('Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification'
    });
  }
});

module.exports = router;
