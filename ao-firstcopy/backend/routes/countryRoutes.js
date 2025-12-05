const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const { auth, checkRole } = require('../middlewares/auth');

// Public routes - anyone can get countries
router.get('/', countryController.getAllCountries);
router.get('/:id', countryController.getCountryById);

// Admin only routes
router.post('/', auth, checkRole(['admin']), countryController.createCountry);
router.put('/:id', auth, checkRole(['admin']), countryController.updateCountry);
router.delete('/:id', auth, checkRole(['admin']), countryController.deleteCountry);

// Seed countries (admin only) - use this endpoint once to populate initial data
router.post('/seed/initial', auth, checkRole(['admin']), countryController.seedCountries);

module.exports = router;
