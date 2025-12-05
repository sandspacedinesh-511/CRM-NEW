const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const messageController = require('../controllers/messageController');

// All routes require authentication
router.use(auth);

// Send a message
router.post('/', messageController.sendMessage);

// Get messages for a specific student
router.get('/student/:studentId', messageController.getStudentMessages);

// Get recent messages for marketing user
router.get('/recent', messageController.getRecentMessages);

// Get unread message count
router.get('/unread-count', messageController.getUnreadCount);

// Mark messages as read for a student
router.patch('/student/:studentId/read', messageController.markAsRead);

module.exports = router;

