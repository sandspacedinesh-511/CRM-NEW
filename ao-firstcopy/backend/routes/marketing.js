const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const marketingController = require('../controllers/marketingController');
const documentController = require('../controllers/documentController');

router.use(auth, checkRole(['marketing', 'b2b_marketing']));

router.get('/dashboard', marketingController.getDashboard);
router.post('/leads', marketingController.createLead);
router.put('/leads/:id', marketingController.updateLead);
router.get('/leads/export', marketingController.exportLeads);
router.get('/leads/:id/documents', marketingController.getLeadDocuments);
router.post('/leads/:id/documents/upload', documentController.upload.single('file'), marketingController.uploadLeadDocument);
router.post('/leads/reminder', marketingController.saveReminder);
router.post('/leads/remarks', marketingController.saveRemarks);
router.get('/leads/:id/applications', marketingController.getLeadApplications);
router.get('/leads/:id/country-profiles', marketingController.getLeadCountryProfiles);
router.get('/leads/:id', marketingController.getLeadDetails);
router.get('/leads', marketingController.getLeads);
router.get('/activities', marketingController.getActivities);

module.exports = router;

