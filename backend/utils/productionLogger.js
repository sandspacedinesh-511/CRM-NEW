/**
 * Production-Safe Logger Utility
 * Logs are only written to console in development mode
 * In production, only errors are logged for troubleshooting
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isLoggingEnabled = process.env.ENABLE_LOGS === 'true';

/**
 * Log message (only in development or if explicitly enabled)
 */
const log = (message, data = null) => {
  if (isDevelopment || isLoggingEnabled) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

/**
 * Log error (always logged for troubleshooting)
 */
const error = (message, errorObj = null) => {
  if (errorObj) {
    console.error(`[ERROR] ${message}`, errorObj);
  } else {
    console.error(`[ERROR] ${message}`);
  }
};

/**
 * Log warning (only in development)
 */
const warn = (message, data = null) => {
  if (isDevelopment || isLoggingEnabled) {
    if (data) {
      console.warn(`[WARNING] ${message}`, data);
    } else {
      console.warn(`[WARNING] ${message}`);
    }
  }
};

/**
 * Log info (only in development)
 */
const info = (message, data = null) => {
  if (isDevelopment || isLoggingEnabled) {
    if (data) {
      console.info(`[INFO] ${message}`, data);
    } else {
      console.info(`[INFO] ${message}`);
    }
  }
};

/**
 * Log only in development
 */
const debug = (message, data = null) => {
  if (isDevelopment) {
    if (data) {
      console.debug(`[DEBUG] ${message}`, data);
    } else {
      console.debug(`[DEBUG] ${message}`);
    }
  }
};

module.exports = {
  log,
  error,
  warn,
  info,
  debug,
  isProduction,
  isDevelopment
};
