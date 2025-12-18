const { performanceLogger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  const originalSend = res.send;
  
  // Override res.send to capture response time
  res.send = function(data) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log API performance
    performanceLogger.logApiRequest(
      req.method,
      req.originalUrl,
      duration,
      res.statusCode,
      req.user?.id
    );
    
    // Check for slow requests
    if (duration > 1000) { // More than 1 second
      performanceLogger.logApiRequest(
        req.method,
        req.originalUrl,
        duration,
        res.statusCode,
        req.user?.id
      );
    }
    
    // Only call original send if headers haven't been sent
    if (!res.headersSent) {
      originalSend.call(this, data);
    }
  };
  
  next();
};

// Database query monitoring
const queryMonitor = (sequelize) => {
  const originalQuery = sequelize.query;
  
  sequelize.query = function(...args) {
    const start = process.hrtime.bigint();
    const query = args[0];
    const params = args[1] || {};
    
    return originalQuery.apply(this, args).then(result => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;
      
      // Log slow queries (only in development for debugging)
      if (process.env.NODE_ENV === 'development' && duration > 200) { // More than 200ms
        performanceLogger.logDatabaseQuery(query, duration, params);
      }
      
      return result;
    }).catch(error => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;
      
      // Only log slow queries or errors in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        performanceLogger.logDatabaseQuery(query, duration, params);
      }
      throw error;
    });
  };
};

// Cache middleware for frequently accessed data
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `api:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    
    try {
      // Try to get from cache
      const cachedData = await cacheUtils.get(cacheKey);
      
      if (cachedData) {
        performanceLogger.logCacheOperation('get', cacheKey, true);
        // Check if headers have already been sent
        if (!res.headersSent) {
          return res.json(cachedData);
        }
      }
      
      // Store original send method
      const originalSend = res.send;
      
      // Override send to cache response
      res.send = function(data) {
        try {
          // Only cache if headers haven't been sent and response is successful
          if (!res.headersSent && res.statusCode >= 200 && res.statusCode < 300) {
            const responseData = JSON.parse(data);
            cacheUtils.set(cacheKey, responseData, ttl);
            performanceLogger.logCacheOperation('set', cacheKey, false);
          }
        } catch (error) {
          // If not JSON, don't cache
        }
        
        // Only call original send if headers haven't been sent
        if (!res.headersSent) {
          originalSend.call(this, data);
        }
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Rate limiting middleware
const rateLimiter = require('express-rate-limit');

const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimiter({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      performanceLogger.logApiRequest(
        req.method,
        req.originalUrl,
        0,
        429,
        req.user?.id
      );
      
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Slow down middleware for brute force protection
const slowDown = require('express-slow-down');

const createSlowDown = (windowMs = 15 * 60 * 1000, delayAfter = 50, delayMs = 500) => {
  return slowDown({
    windowMs,
    delayAfter,
    delayMs,
    handler: (req, res) => {
      performanceLogger.logApiRequest(
        req.method,
        req.originalUrl,
        0,
        429,
        req.user?.id
      );
      
      res.status(429).json({
        error: 'Too many requests, please slow down.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log high memory usage
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // More than 500MB
    performanceLogger.logApiRequest(
      req.method,
      req.originalUrl,
      0,
      res.statusCode,
      req.user?.id
    );
  }
  
  // Add memory info to response headers in development
  if (process.env.NODE_ENV === 'development') {
    res.set('X-Memory-Usage', `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }
  
  next();
};

// Database connection monitoring
const dbConnectionMonitor = (sequelize) => {
  setInterval(() => {
    const pool = sequelize.connectionManager.pool;
    const stats = {
      total: pool.size,
      idle: pool.idle,
      waiting: pool.waiting,
      acquired: pool.acquired
    };
    
    // Log connection pool issues
    if (stats.waiting > 5) {
      performanceLogger.logApiRequest(
        'DB_POOL',
        'connection_pool',
        0,
        200,
        null
      );
    }
  }, 30000); // Check every 30 seconds
};

// Response time headers
const responseTimeHeaders = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    // Check if headers have already been sent to prevent ERR_HTTP_HEADERS_SENT
    if (!res.headersSent) {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;
      
      res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Cache invalidation middleware
const cacheInvalidation = (patterns = []) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = async function(data) {
      try {
        // Invalidate cache patterns after successful operations
        if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
          for (const pattern of patterns) {
            await cacheUtils.clearPattern(pattern);
          }
        }
      } catch (error) {
        // Continue even if cache invalidation fails
      }
      
      // Only call original send if headers haven't been sent
      if (!res.headersSent) {
        originalSend.call(this, data);
      }
    };
    
    next();
  };
};

// Performance metrics collection
const collectMetrics = (req, res, next) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    startTime: Date.now()
  };
  
  req.performanceMetrics = metrics;
  
  res.on('finish', () => {
    metrics.duration = Date.now() - metrics.startTime;
    metrics.statusCode = res.statusCode;
    
    // Store metrics in cache for analysis
    const key = `metrics:${new Date().toISOString().split('T')[0]}`;
    cacheUtils.hset(key, Date.now().toString(), metrics, 86400); // 24 hours
  });
  
  next();
};

module.exports = {
  performanceMonitor,
  queryMonitor,
  cacheMiddleware,
  createRateLimit,
  createSlowDown,
  memoryMonitor,
  dbConnectionMonitor,
  responseTimeHeaders,
  cacheInvalidation,
  collectMetrics
};
