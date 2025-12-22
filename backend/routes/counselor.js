const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const counselorController = require('../controllers/counselorController');
const documentController = require('../controllers/documentController');
const { upload } = require('../config/storage.config');
const { cacheMiddleware, cacheInvalidation } = require('../middlewares/performance');

// Middleware to check if user is counselor
const isCounselor = (req, res, next) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ message: 'Access denied. Counselor only1.' });
  }
  next();
};

// Apply auth and counselor check middleware to all routes
router.use(auth, isCounselor);

// Dashboard routes
router.get('/dashboard', cacheMiddleware(300), counselorController.getDashboardStats); // 5 minutes cache
router.post('/dashboard/clear-cache', counselorController.clearDashboardCache);

// Student management routes
router.get('/students', cacheMiddleware(60), counselorController.getStudents); // 1 minute cache
router.post('/students', cacheInvalidation(['api:counselor/students*', 'api:counselor/dashboard*']), counselorController.addStudent);
router.get('/students/check-email', counselorController.checkEmailAvailability);
router.get('/students/:id', counselorController.getStudentDetails);
router.put('/students/:id', cacheInvalidation(['api:counselor/students*', 'api:counselor/dashboard*']), counselorController.updateStudent);
router.patch('/students/:id/phase', cacheInvalidation(['api:counselor/students*', 'api:counselor/dashboard*']), counselorController.updateStudentPhase);
router.post('/students/:id/phase/reopen', cacheInvalidation(['api:counselor/students*', 'api:counselor/dashboard*']), counselorController.reopenPhase);
router.get('/students/:id/phase-metadata', counselorController.getPhaseMetadata);
router.post('/students/:id/pause', cacheInvalidation(['api:counselor/students*', 'api:counselor/dashboard*']), counselorController.pauseStudent);
router.post('/students/:id/play', cacheInvalidation(['api:counselor/students*', 'api:counselor/dashboard*']), counselorController.playStudent);
router.delete('/students/:id', cacheInvalidation(['api:counselor/students*', 'api:counselor/dashboard*']), counselorController.deleteStudent);
router.get('/students/export', counselorController.exportStudents);

// Student documents routes (using DigitalOcean Spaces)
router.get('/students/:id/documents', counselorController.getStudentDocuments);
router.post('/students/:id/documents', counselorController.createDocument);
router.post('/students/:id/documents/upload', upload.single('file'), documentController.uploadDocument);
// Removed duplicate route - only /students/:id/documents/upload is needed
router.get('/students/:id/documents/export', counselorController.exportDocuments);

// Document routes (using DigitalOcean Spaces)
router.get('/documents/:id/preview', documentController.previewDocument);
router.get('/documents/:id/download', documentController.downloadDocument);
router.delete('/documents/:id', documentController.deleteDocument);
router.patch('/documents/:id', documentController.updateDocumentStatus);

// Legacy document routes (for backward compatibility)
router.put('/documents/:id', counselorController.updateDocument);

// General documents routes
router.get('/documents', counselorController.getAllDocuments);
// router.post('/documents/upload', upload.single('file'), counselorController.uploadDocument); // DISABLED - Use DigitalOcean Spaces route instead

// Student applications routes
router.get('/students/:id/applications', counselorController.getStudentApplications);
router.get('/applications', counselorController.getApplications);
router.post('/applications', counselorController.createApplication);
router.put('/applications/:id', counselorController.updateApplication);
router.delete('/applications/:id', counselorController.deleteApplication);

// Country profile routes
router.get('/students/:id/country-profiles', counselorController.getStudentCountryProfiles);
router.post('/students/country-profile', counselorController.createCountryProfile);
router.post('/students/auto-create-country-profiles', counselorController.autoCreateCountryProfiles);

// Student notes routes
router.get('/students/:id/notes', counselorController.getStudentNotes);
router.post('/students/:id/notes', counselorController.addNote);
router.put('/students/:id/notes/:noteId', counselorController.updateNote);
router.delete('/students/:id/notes/:noteId', counselorController.deleteNote);

// Student activities routes
router.get('/students/:id/activities', counselorController.getStudentActivities);

// Student email routes
router.post('/students/:id/send-email', counselorController.sendEmailToStudent);

// General tasks routes
router.get('/tasks', counselorController.getCounselorTasks);
router.post('/tasks', counselorController.createGeneralTask);
router.put('/tasks/:taskId', counselorController.updateGeneralTask);
router.delete('/tasks/:taskId', counselorController.deleteGeneralTask);

// Student tasks routes
router.get('/students/:id/tasks', counselorController.getStudentTasks);
router.post('/students/:id/tasks', counselorController.createTask);
router.put('/students/:id/tasks/:taskId', counselorController.updateTask);
router.delete('/students/:id/tasks/:taskId', counselorController.deleteTask);

// University routes
router.get('/universities', counselorController.getUniversities);

// Profile routes
router.get('/profile', counselorController.getProfile);
router.put('/profile', counselorController.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), counselorController.uploadAvatar);

// Lead assignment acceptance (also clears dashboard cache so totals update)
router.post(
  '/leads/:id/accept-assignment',
  cacheInvalidation(['api:counselor/dashboard*']),
  counselorController.acceptLeadAssignment
);

// Counselor lead sharing routes
router.get('/counselors', counselorController.getAvailableCounselors);
router.post(
  '/students/:id/share',
  cacheInvalidation(['api:counselor/dashboard*']),
  counselorController.shareLeadWithCounselor
);

// Test endpoint for Digital Ocean configuration (no auth required for testing)
router.get('/test-storage', async (req, res) => {
  try {
    const DigitalOceanStorageService = require('../services/digitalOceanStorage');
    const storageService = new DigitalOceanStorageService();

    // Test actual upload with a small test file
    const testFile = {
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 10,
      buffer: Buffer.from('test content')
    };

    try {
      const uploadResult = await storageService.uploadFile(testFile, 'test');

      res.json({
        success: true,
        message: 'Digital Ocean Storage Service working correctly',
        config: {
          bucket: process.env.DO_SPACES_BUCKET ? 'SET' : 'NOT_SET',
          key: process.env.DO_SPACES_KEY ? 'SET' : 'NOT_SET',
          secret: process.env.DO_SPACES_SECRET ? 'SET' : 'NOT_SET',
          region: process.env.DO_SPACES_REGION,
          endpoint: process.env.DO_SPACES_ENDPOINT
        },
        testUpload: {
          success: true,
          result: uploadResult
        }
      });
    } catch (uploadError) {
      res.json({
        success: false,
        message: 'Digital Ocean Storage Service initialized but upload failed',
        config: {
          bucket: process.env.DO_SPACES_BUCKET ? 'SET' : 'NOT_SET',
          key: process.env.DO_SPACES_KEY ? 'SET' : 'NOT_SET',
          secret: process.env.DO_SPACES_SECRET ? 'SET' : 'NOT_SET',
          region: process.env.DO_SPACES_REGION,
          endpoint: process.env.DO_SPACES_ENDPOINT
        },
        testUpload: {
          success: false,
          error: uploadError.message,
          details: uploadError
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Digital Ocean Storage Service initialization failed',
      error: error.message
    });
  }
});

module.exports = router; 