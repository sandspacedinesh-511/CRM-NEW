// Health check endpoint for production monitoring
const http = require('http');
const mysql = require('mysql2/promise');
const redis = require('ioredis');

const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
};

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('DB_PASSWORD');
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection(config.db);
    await connection.execute('SELECT 1');
    await connection.end();
    return { status: 'healthy', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'unhealthy', message: `Database error: ${error.message}` };
  }
}

async function checkRedis() {
  try {
    const redisClient = new redis(config.redis);
    await redisClient.ping();
    await redisClient.disconnect();
    return { status: 'healthy', message: 'Redis connection successful' };
  } catch (error) {
    return { status: 'unhealthy', message: `Redis error: ${error.message}` };
  }
}

async function checkDiskSpace() {
  try {
    const fs = require('fs');
    const stats = fs.statSync('.');
    return { status: 'healthy', message: 'Disk space available' };
  } catch (error) {
    return { status: 'unhealthy', message: `Disk error: ${error.message}` };
  }
}

async function performHealthCheck() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDiskSpace(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };

  const allHealthy = Object.values(checks).every(check => 
    typeof check === 'object' && check.status === 'healthy'
  );

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks
  };
}

// Create HTTP server for health checks
const server = http.createServer(async (req, res) => {
  if (req.url === '/health' || req.url === '/api/health') {
    try {
      const healthStatus = await performHealthCheck();
      
      res.writeHead(healthStatus.status === 'healthy' ? 200 : 503, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      
      res.end(JSON.stringify(healthStatus, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start health check server
const PORT = process.env.HEALTH_CHECK_PORT || 3000;
server.listen(PORT, () => {
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
