const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const cluster = require('cluster');
const os = require('os');
const path = require('path');
require('dotenv').config();

// Security validation
const { validateEnvironmentSecurity, isProduction } = require('./utils/security');

// Digital Ocean Storage validation
const validateDigitalOceanConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    const requiredVars = ['DO_SPACES_KEY', 'DO_SPACES_SECRET', 'DO_SPACES_BUCKET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('[ERROR] Digital Ocean Spaces configuration missing in production:', missingVars);
      console.error('[ERROR] Server cannot start without proper file storage configuration');
      process.exit(1);
    }
  }
};

const websocketService = require('./services/websocketService');
const {
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
} = require('./middlewares/performance');
const { logger, performanceLogger } = require('./utils/logger');
const sequelize = require('./config/database');
const { redis, redisConnected } = require('./config/redis');

// Import routes
const authRoutes = require('./routes/auth');
const counselorRoutes = require('./routes/counselor');
const adminRoutes = require('./routes/admin');
const applicationRoutes = require('./routes/applications');
const documentRoutes = require('./routes/documents');
const universityRoutes = require('./routes/universities');
const countryProcessRoutes = require('./routes/countryProcesses');
const countryRoutes = require('./routes/countryRoutes');
const telecallerRoutes = require('./routes/telecaller');
const marketingRoutes = require('./routes/marketing');
const messageRoutes = require('./routes/messages');
const reminderRoutes = require('./routes/reminders');

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate environment configuration
validateDigitalOceanConfig();

// Cluster setup for better performance
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  logger.info(`Master ${process.pid} is running`);
  logger.info(`Starting ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });

  // Monitor cluster health
  setInterval(() => {
    const workers = Object.keys(cluster.workers);
    logger.info(`Active workers: ${workers.length}`);
  }, 30000);

} else {
  // Worker process
  startServer();
}

function startServer() {
  try {
    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket service
    websocketService.initialize(server);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Development mode: allow localhost variations
        if (process.env.NODE_ENV === 'development') {
          if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
          }
        }

        // Production mode: use environment variable
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
        ].filter(Boolean); // Remove undefined/empty entries

        if (allowedOrigins.length === 0) {
          if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
          }
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP'],
      optionsSuccessStatus: 200 // Some legacy browsers choke on 204
    };

    app.use(cors(corsOptions));

    // Compression middleware
    app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Logging middleware - disabled to reduce console output
    // app.use(morgan('combined', {
    //   stream: {
    //     write: (message) => logger.info(message.trim())
    //   }
    // }));

    // Performance monitoring middleware
    app.use(performanceMonitor);
    app.use(responseTimeHeaders);
    app.use(memoryMonitor);
    app.use(collectMetrics);

    // Rate limiting middleware
    const generalRateLimit = createRateLimit(15 * 60 * 1000, 100); // 15 minutes, 100 requests
    const authRateLimit = createRateLimit(15 * 60 * 1000, process.env.NODE_ENV === 'development' ? 100 : 5); // More lenient in development
    const uploadRateLimit = createRateLimit(15 * 60 * 1000, 10); // 15 minutes, 10 uploads

    // Apply rate limiting (relaxed in development)
    app.use('/api/auth', authRateLimit);
    app.use('/api/documents/upload', uploadRateLimit);

    if (process.env.NODE_ENV === 'production') {
      app.use('/api', generalRateLimit);

      // Slow down middleware for brute force protection
      const slowDown = createSlowDown(15 * 60 * 1000, 50, 500);
      app.use('/api', slowDown);
    }

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        // Check database connection
        await sequelize.authenticate();

        // Check Redis connection
        const redisStatus = redisConnected();

        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          redis: redisStatus ? 'connected' : 'disconnected',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });

    // Database monitoring
    queryMonitor(sequelize);
    dbConnectionMonitor(sequelize);

    // Global request logger for debugging
    app.use('/api', (req, res, next) => {
      // Also log to file for debugging
      const fs = require('fs');
      const logEntry = `${new Date().toISOString()} - ${req.method} ${req.url} ${req.path}\n`;
      fs.appendFileSync('debug-requests.log', logEntry);
      next();
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/counselor', counselorRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/telecaller', telecallerRoutes);
    app.use('/api/marketing', marketingRoutes);
    app.use('/api/applications', applicationRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/universities', universityRoutes);
    app.use('/api/country-processes', countryProcessRoutes);
    app.use('/api/countries', countryRoutes);
    app.use('/api/validation', require('./routes/validation'));
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/shared-leads', require('./routes/sharedLead'));

    // Advanced Features Routes
    app.use('/api/admin-events', require('./routes/adminEvents'));
    app.use('/api/bulk-counselors', require('./routes/bulkCounselors'));
    app.use('/api/password-requests', require('./routes/passwordRequests'));
    app.use('/api/student-referrals', require('./routes/studentReferrals'));
    app.use('/api/session-management', require('./routes/sessionManagement'));
    app.use('/api/monitored-chat', require('./routes/monitoredChat'));
    app.use('/api/admin-student-dashboard', require('./routes/adminStudentDashboard'));
    app.use('/api/alerts-reminders', require('./routes/alertsReminders'));
    app.use('/api/counselor-activity-tracking', require('./routes/counselorActivityTracking'));
    app.use('/api/performance-analytics', require('./routes/performanceAnalytics'));
    app.use('/api/messages', messageRoutes);
    app.use('/api/reminders', reminderRoutes);

    // Static file serving for uploads (development only)
    if (process.env.NODE_ENV !== 'production') {
      app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    }

    // Global error handler
    app.use((error, req, res, next) => {
      console.error('[ERROR] Global error handler:', error);
      console.error('[STACK] Error stack:', error.stack);
      console.error('[INFO] Request URL:', req.url);
      console.error('[INFO] Request method:', req.method);
      res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    // Apply caching middleware AFTER routes (so authentication is processed first)
    // Note: Caching is now handled within individual route handlers where req.user is available

    // Test endpoint for Digital Ocean (no auth required)
    app.get('/test-storage', async (req, res) => {
      try {
        const DigitalOceanStorageService = require('./services/digitalOceanStorage');
        const storageService = new DigitalOceanStorageService();

        // Test actual upload with a small test file
        const testFile = {
          originalname: 'test.txt',
          mimetype: 'text/plain',
          size: 10,
          buffer: Buffer.from('test content')
        };

        try {
          const uploadResult = await storageService.uploadFile(testFile, 'test');

          res.json({
            success: true,
            message: 'Digital Ocean Storage Service working correctly',
            config: {
              bucket: process.env.DO_SPACES_BUCKET ? 'SET' : 'NOT_SET',
              key: process.env.DO_SPACES_KEY ? 'SET' : 'NOT_SET',
              secret: process.env.DO_SPACES_SECRET ? 'SET' : 'NOT_SET',
              region: process.env.DO_SPACES_REGION,
              endpoint: process.env.DO_SPACES_ENDPOINT
            },
            testUpload: {
              success: true,
              result: uploadResult
            }
          });
        } catch (uploadError) {
          res.json({
            success: false,
            message: 'Digital Ocean Storage Service initialized but upload failed',
            config: {
              bucket: process.env.DO_SPACES_BUCKET ? 'SET' : 'NOT_SET',
              key: process.env.DO_SPACES_KEY ? 'SET' : 'NOT_SET',
              secret: process.env.DO_SPACES_SECRET ? 'SET' : 'NOT_SET',
              region: process.env.DO_SPACES_REGION,
              endpoint: process.env.DO_SPACES_ENDPOINT
            },
            testUpload: {
              success: false,
              error: uploadError.message,
              details: uploadError
            }
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Digital Ocean Storage Service initialization failed',
          error: error.message
        });
      }
    });

    // Swagger Documentation Routes
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Counselor CRM API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true
      }
    }));

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Counselor CRM API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true
      }
    }));

    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);

      if (err.name === 'SequelizeConnectionError') {
        return res.status(503).json({
          error: 'Database Connection Error',
          details: err.message
        });
      }

      if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Database Validation Error',
          details: err.errors.map(e => e.message)
        });
      }

      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          error: 'Duplicate Entry',
          details: 'A record with this information already exists'
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(() => {
        logger.info('HTTP server closed');

        // Close database connections
        sequelize.close().then(() => {
          logger.info('Database connections closed');
        });

        // Close Redis connections if available
        if (redis && redisConnected()) {
          redis.quit().then(() => {
            logger.info('Redis connections closed');
          });
        }

        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Validate environment security before starting server
    const securityValidation = validateEnvironmentSecurity();
    if (!securityValidation.isValid) {
      logger.error(' Security validation failed:');
      securityValidation.errors.forEach(error => logger.error(`  - ${error}`));
      process.exit(1);
    }

    if (securityValidation.warnings.length > 0) {
      logger.warn('  Security warnings:');
      securityValidation.warnings.forEach(warning => logger.warn(`  - ${warning}`));
    }

    // Start server immediately without waiting for Redis
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Worker ${process.pid} started`);

      if (cluster.isWorker) {
        logger.info(` Worker ${process.pid} ready to handle requests`);
      }

      // Log Redis status after server starts
      setTimeout(() => {
        if (redisConnected()) {
          // Redis connected successfully
        } else {
          // Redis not available - using in-memory cache fallback
        }
      }, 1000);

      // Start reminder scheduler
      const reminderScheduler = require('./services/reminderScheduler');
      reminderScheduler.start();
      logger.info('✓ Reminder scheduler started');
    });

    // Monitor server performance (only in production)
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        if (memUsage.heapUsed > 500 * 1024 * 1024) { // More than 500MB
          logger.warn('High memory usage detected', {
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
          });
        }

        performanceLogger.logApiRequest(
          'SYSTEM',
          'performance_monitor',
          0,
          200,
          null
        );
      }, 60000);
    }

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

module.exports = app; // restart
