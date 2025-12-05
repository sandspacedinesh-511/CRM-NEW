const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const countryProcessController = require('../controllers/countryProcessController');

// Public routes (no auth required)
router.get('/', countryProcessController.getAllCountryProcesses);
router.get('/countries', countryProcessController.getCountriesList);
router.get('/country/:country', countryProcessController.getCountryProcessByCountry);
router.get('/code/:countryCode', countryProcessController.getCountryProcessByCode);

// Admin-only routes
router.use(auth);
router.use(checkRole(['admin']));

router.post('/', countryProcessController.createCountryProcess);
router.put('/:id', countryProcessController.updateCountryProcess);
router.delete('/:id', countryProcessController.deleteCountryProcess);

module.exports = router;
