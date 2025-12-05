const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const validationController = require('../controllers/validationController');

// Check if email exists
router.post('/email', auth, validationController.checkEmailExists);

// Check if phone number exists
router.post('/phone', auth, validationController.checkPhoneExists);

// Check if passport number exists
router.post('/passport', auth, validationController.checkPassportExists);

// Check all fields at once
router.post('/all', auth, validationController.checkAllFields);

module.exports = router;
