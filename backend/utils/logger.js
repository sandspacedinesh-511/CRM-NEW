const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  // Only log warnings and errors to console, not info/debug
  return 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport - only log warnings and errors
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),

  // Error log file
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),

  // Combined log file
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),

  // Real-time operations log
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/realtime-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxSize: '20m',
    maxFiles: '7d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),

  // Performance log
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/performance-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxSize: '20m',
    maxFiles: '7d',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});

// Performance monitoring utilities
const performanceLogger = {
  startTimer: (operation) => {
    const start = process.hrtime.bigint();
    return {
      operation,
      start,
      end: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        // Log to file only, not console
        // logger.info(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  },

  logDatabaseQuery: (query, duration, params = {}) => {
    // Handle different query types (string, object, etc.)
    let queryString = '';
    if (typeof query === 'string') {
      queryString = query;
    } else if (query && typeof query === 'object') {
      queryString = query.sql || query.query || JSON.stringify(query);
    } else {
      queryString = String(query);
    }

    logger.info('Database Query', {
      query: queryString.substring(0, 200) + (queryString.length > 200 ? '...' : ''),
      duration: `${duration.toFixed(2)}ms`,
      params: Object.keys(params).length > 0 ? params : undefined
    });
  },

  logApiRequest: (method, url, duration, statusCode, userId = null) => {
    // Log to file only, not console
    // logger.info('API Request', {
    //   method,
    //   url,
    //   duration: `${duration.toFixed(2)}ms`,
    //   statusCode,
    //   userId
    // });
  },

  logCacheOperation: (operation, key, hit, duration = null) => {
    logger.info('Cache Operation', {
      operation,
      key,
      hit,
      duration: duration ? `${duration.toFixed(2)}ms` : undefined
    });
  },

  logWebSocketEvent: (event, userId, data = {}) => {
    logger.info('WebSocket Event', {
      event,
      userId,
      dataSize: JSON.stringify(data).length
    });
  },

  logRealTimeUpdate: (type, entityId, userId, changes = {}) => {
    logger.info('Real-time Update', {
      type,
      entityId,
      userId,
      changes: Object.keys(changes).length > 0 ? changes : undefined
    });
  }
};

// Error tracking utilities
const errorLogger = {
  logError: (error, context = {}) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context
    });
  },

  logDatabaseError: (error, query, params = {}) => {
    logger.error('Database Error', {
      message: error.message,
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: Object.keys(params).length > 0 ? params : undefined
    });
  },

  logValidationError: (errors, requestData = {}) => {
    logger.warn('Validation Error', {
      errors,
      requestData: Object.keys(requestData).length > 0 ? requestData : undefined
    });
  },

  logSecurityEvent: (event, userId, ip, details = {}) => {
    logger.warn('Security Event', {
      event,
      userId,
      ip,
      details
    });
  }
};

// Real-time monitoring utilities
const realTimeLogger = {
  logUserActivity: (userId, action, details = {}) => {
    logger.info('User Activity', {
      userId,
      action,
      timestamp: new Date().toISOString(),
      details
    });
  },

  logApplicationStatusChange: (applicationId, oldStatus, newStatus, userId) => {
    logger.info('Application Status Change', {
      applicationId,
      oldStatus,
      newStatus,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  logDocumentUpload: (documentId, studentId, fileSize, fileType) => {
    logger.info('Document Upload', {
      documentId,
      studentId,
      fileSize,
      fileType,
      timestamp: new Date().toISOString()
    });
  },

  logNotificationSent: (userId, type, channel, success) => {
    logger.info('Notification Sent', {
      userId,
      type,
      channel,
      success,
      timestamp: new Date().toISOString()
    });
  }
};

// Export the logger and utilities
module.exports = {
  logger,
  performanceLogger,
  errorLogger,
  realTimeLogger
};
