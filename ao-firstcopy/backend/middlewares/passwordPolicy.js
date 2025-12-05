const { User } = require('../models');

/**
 * Middleware to validate password policy
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validatePasswordPolicy = (req, res, next) => {
  const { password, newPassword } = req.body;
  const passwordToValidate = password || newPassword;

  if (!passwordToValidate) {
    return next();
  }

  const validation = User.validatePasswordStrength(passwordToValidate);
  
  if (!validation.isValid) {
    return res.status(400).json({
      message: 'Password does not meet security requirements',
      requirements: validation.requirements,
      errorType: 'PASSWORD_POLICY_VIOLATION'
    });
  }

  next();
};

/**
 * Middleware to check if password change is required
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkPasswordChangeRequired = async (req, res, next) => {
  try {
    // Password change requirement check removed - field doesn't exist in database
    next();
  } catch (error) {
    console.error('Password change check error:', error);
    next();
  }
};

/**
 * Middleware to validate password complexity for user creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateUserPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      message: 'Password is required',
      errorType: 'MISSING_PASSWORD'
    });
  }

  const validation = User.validatePasswordStrength(password);
  
  if (!validation.isValid) {
    return res.status(400).json({
      message: 'Password does not meet security requirements',
      requirements: validation.requirements,
      errorType: 'PASSWORD_POLICY_VIOLATION'
    });
  }

  next();
};

module.exports = {
  validatePasswordPolicy,
  checkPasswordChangeRequired,
  validateUserPassword
};
