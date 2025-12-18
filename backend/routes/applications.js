const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const applicationController = require('../controllers/applicationController');

// Apply auth middleware to all routes
router.use(auth);
router.use(checkRole(['counselor', 'admin']));

// Get all applications with enhanced filtering
router.get('/', applicationController.getApplications);

// Get applications by country for a specific student
router.get('/student/:studentId/by-country', applicationController.getStudentApplicationsByCountry);

// Create multiple applications for a student
router.post('/multiple', applicationController.createMultipleApplications);

// Update application priority and choices
router.put('/:applicationId/priority', applicationController.updateApplicationPriority);

// Get students with multiple country applications
router.get('/multiple-countries', applicationController.getStudentsWithMultipleCountries);

// Get students without dual applications (single country only)
router.get('/single-country', applicationController.getStudentsWithoutDualApplications);

// Get application statistics for dashboard
router.get('/statistics', applicationController.getApplicationStatistics);

module.exports = router;
