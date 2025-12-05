const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const marketingController = require('../controllers/marketingController');

router.use(auth, checkRole(['marketing', 'b2b_marketing']));

router.get('/dashboard', marketingController.getDashboard);
router.post('/leads', marketingController.createLead);
router.put('/leads/:id', marketingController.updateLead);
router.get('/leads', marketingController.getLeads);
router.get('/leads/export', marketingController.exportLeads);
router.get('/activities', marketingController.getActivities);

module.exports = router;

