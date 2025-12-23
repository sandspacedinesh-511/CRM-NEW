const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const counselorMonitoringController = require('../controllers/counselorMonitoringController');
const { auth, checkRole } = require('../middlewares/auth');
const { cacheMiddleware, cacheInvalidation } = require('../middlewares/performance');
const multer = require('multer');

// Configure multer for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  }
});

// Apply authentication and role middleware to all routes
router.use(auth);
router.use(checkRole(['admin']));

// Existing admin routes with caching
router.get('/dashboard', cacheMiddleware(300), adminController.getDashboardStats); // 5 minutes cache
router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentById);
router.put('/students/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateStudent);
router.delete('/students/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.deleteStudent);
router.get('/counselors', adminController.getCounselors);
router.get('/deleted-records', adminController.getDeletedRecords);
router.post('/deleted-records/:recordId/restore', adminController.restoreDeletedRecord);
router.post('/deleted-records/bulk-restore', adminController.bulkRestoreDeletedRecords);
router.post('/counselors', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.addCounselor);
router.put('/counselors/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateCounselor);
router.patch('/counselors/:id/status', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateCounselorStatus);
router.delete('/counselors/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.deleteCounselor);

router.get('/telecallers', adminController.getTelecallers);
router.post('/telecallers', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.addTelecaller);
router.put('/telecallers/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateTelecaller);
router.patch('/telecallers/:id/status', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateTelecallerStatus);
router.delete('/telecallers/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.deleteTelecaller);
// Admin: dashboard/queue for a specific telecaller
router.get('/telecallers/:id/dashboard', adminController.getTelecallerDashboardAdmin);
// Admin: assign a telecaller-imported lead to a counselor
router.post(
  '/telecallers/:telecallerId/imported-leads/:leadId/assign-counselor',
  adminController.assignTelecallerImportedLeadToCounselorAdmin
);

router.get('/marketing-team', adminController.getMarketingTeam);
router.post('/marketing-team', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.addMarketingTeamMember);
router.put('/marketing-team/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateMarketingTeamMember);
router.patch('/marketing-team/:id/status', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateMarketingTeamMemberStatus);
router.delete('/marketing-team/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.deleteMarketingTeamMember);
// Admin: leads for a specific marketing team member
router.get('/marketing-team/leads/:id', adminController.getMarketingMemberLeadsAdmin);
router.get('/marketing-team/:id/leads', adminController.getMarketingMemberLeadsAdmin);

router.get('/b2b-marketing-team', adminController.getB2BMarketingTeam);
router.post('/b2b-marketing-team', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.addB2BMarketingTeamMember);
router.put('/b2b-marketing-team/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateB2BMarketingTeamMember);
router.patch('/b2b-marketing-team/:id/status', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.updateB2BMarketingTeamMemberStatus);
router.delete('/b2b-marketing-team/:id', cacheInvalidation(['api:/api/admin/dashboard*', 'api:/api/admin/analytics*']), adminController.deleteB2BMarketingTeamMember);
// Admin: leads for a specific B2B marketing team member
router.get('/b2b-marketing-team/leads/:id', adminController.getB2BMarketingMemberLeadsAdmin);
router.get('/b2b-marketing-team/:id/leads', adminController.getB2BMarketingMemberLeadsAdmin);

// Admin: download documents for a lead
router.get('/leads/:leadId/documents/download', adminController.downloadLeadDocuments);

// Admin: assign lead to counselor
router.patch('/leads/:id/assign-counselor', adminController.assignLeadToCounselorAdmin);
router.patch('/students/:id/assign-counselor', adminController.assignLeadToCounselorAdmin);

router.get('/universities', cacheMiddleware(1800), adminController.getUniversities); // 30 minutes cache
router.post('/universities', cacheInvalidation(['api:/api/admin/universities*']), adminController.addUniversity);
router.post('/universities/bulk-import', upload.single('file'), cacheInvalidation(['api:/api/admin/universities*']), adminController.bulkImportUniversities);
router.put('/universities/:id', cacheInvalidation(['api:/api/admin/universities*']), adminController.updateUniversity);
router.post('/universities/bulk-delete', cacheInvalidation(['api:/api/admin/universities*']), adminController.deleteUniversities);
router.delete('/universities/:id', cacheInvalidation(['api:/api/admin/universities*']), adminController.deleteUniversity);
router.get('/analytics', cacheMiddleware(600), adminController.getAnalytics); // 10 minutes cache
router.get('/analytics/export', adminController.exportAnalytics);
router.get('/reports', adminController.getReports);
router.get('/reports/export', adminController.exportReports);
router.get('/settings', adminController.getSettings);

// Counselor monitoring routes
router.get('/counselor-monitoring', counselorMonitoringController.getCounselorMonitoringData);
router.get('/counselor-monitoring/real-time', counselorMonitoringController.getRealTimeActivityFeed);
router.get('/counselor-monitoring/export', counselorMonitoringController.exportCounselorActivity);
router.get('/counselor-monitoring/:counselorId', counselorMonitoringController.getCounselorActivityDetails);

module.exports = router; 