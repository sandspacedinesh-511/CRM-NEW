const crypto = require('crypto');

/**
 * Security utility functions for production environment
 */

/**
 * Validate environment variables for security
 * @returns {Object} Validation result
 */
const validateEnvironmentSecurity = () => {
  const errors = [];
  const warnings = [];

  // Check for required environment variables
  const requiredVars = [
    'JWT_SECRET',
    'NODE_ENV'
  ];

  // DB_PASSWORD is only required in production
  if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
    errors.push('Missing required environment variable: DB_PASSWORD');
  }

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Check JWT secret strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    if (process.env.JWT_SECRET === 'your-secret-key' || 
        process.env.JWT_SECRET === 'secret' ||
        process.env.JWT_SECRET === 'admin') {
      errors.push('JWT_SECRET must not use default/weak values');
    }
  }

  // Check database password strength (only in production)
  if (process.env.DB_PASSWORD && process.env.NODE_ENV === 'production') {
    if (process.env.DB_PASSWORD === 'admin' || 
        process.env.DB_PASSWORD === 'password' ||
        process.env.DB_PASSWORD === 'root') {
      errors.push('DB_PASSWORD must not use default/weak values');
    }
    if (process.env.DB_PASSWORD.length < 8) {
      warnings.push('DB_PASSWORD should be at least 8 characters long');
    }
  }
  
  // In development, warn about weak passwords but don't block
  if (process.env.DB_PASSWORD && process.env.NODE_ENV === 'development') {
    if (process.env.DB_PASSWORD === 'admin' || 
        process.env.DB_PASSWORD === 'password' ||
        process.env.DB_PASSWORD === 'root') {
      warnings.push('DB_PASSWORD uses a weak/default value - consider using a stronger password');
    }
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    warnings.push('Running in development mode - ensure this is intentional for production');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Generate a secure random string
 * @param {number} length - Length of the string
 * @returns {string} Secure random string
 */
const generateSecureRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure JWT secret
 * @returns {string} Secure JWT secret
 */
const generateSecureJWTSecret = () => {
  return generateSecureRandomString(64);
};

/**
 * Generate a secure database password
 * @param {number} length - Length of the password
 * @returns {string} Secure database password
 */
const generateSecureDBPassword = (length = 16) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Check if running in production environment
 * @returns {boolean} True if in production
 */
const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Get security recommendations
 * @returns {Array} Array of security recommendations
 */
const getSecurityRecommendations = () => {
  const recommendations = [
    'Use HTTPS in production',
    'Enable rate limiting on all endpoints',
    'Implement proper CORS configuration',
    'Use environment variables for all sensitive data',
    'Regularly update dependencies',
    'Implement proper logging and monitoring',
    'Use strong, unique passwords for all accounts',
    'Enable two-factor authentication where possible',
    'Regularly backup data',
    'Implement proper session management'
  ];

  return recommendations;
};

module.exports = {
  validateEnvironmentSecurity,
  generateSecureRandomString,
  generateSecureJWTSecret,
  generateSecureDBPassword,
  isProduction,
  getSecurityRecommendations
};
