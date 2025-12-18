const express = require('express');
const router = express.Router();
const sharedLeadController = require('../controllers/sharedLeadController');
const { auth, checkRole } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(auth);
router.use(checkRole(['counselor']));

// Share a lead
router.post('/share/:id', sharedLeadController.shareLead);

// Accept/Reject shared lead
router.post('/:id/accept', sharedLeadController.acceptSharedLead);
router.post('/:id/reject', sharedLeadController.rejectSharedLead);

// Get pending shared leads
router.get('/pending', sharedLeadController.getPendingSharedLeads);

module.exports = router;
