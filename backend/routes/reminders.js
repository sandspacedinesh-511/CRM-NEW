const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const reminderController = require('../controllers/reminderController');

// All routes require authentication and counselor role
router.use(auth);
router.use(checkRole(['counselor']));

// Create a new reminder
router.post('/', reminderController.createReminder);

// Get all reminders for logged-in counselor
router.get('/', reminderController.getReminders);

// Get pending reminders
router.get('/pending', reminderController.getPendingReminders);

// Get reminders for a specific student
router.get('/student/:studentId', reminderController.getRemindersByStudent);

// Update a reminder
router.patch('/:id', reminderController.updateReminder);

// Delete a reminder
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
