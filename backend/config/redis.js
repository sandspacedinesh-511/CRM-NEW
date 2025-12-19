const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true
};

let redis = null;
let redisConnected = false;

try {
  redis = new Redis(redisConfig);
  
  redis.on('connect', () => {
    logger.info('Redis client connected');
    redisConnected = true;
  });

  redis.on('ready', () => {
    logger.info('Redis client ready');
    redisConnected = true;
  });

  redis.on('error', (err) => {
    logger.error('Redis client error:', err);
    redisConnected = false;
  });

  redis.on('close', () => {
    redisConnected = false;
  });

  redis.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
  });

} catch (error) {
  logger.error('Failed to initialize Redis:', error);
  redisConnected = false;
}

const memoryCache = new Map();

const cacheUtils = {
  async set(key, value, ttl = 300) {
    try {
      if (redis && redisConnected) {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        await redis.setex(key, ttl, serializedValue);
        return true;
      } else {
        memoryCache.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });
        return true;
      }
    } catch (error) {
      logger.error('Cache set error:', error);
      memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
      });
      return true;
    }
  },

  async get(key) {
    try {
      if (redis && redisConnected) {
        const value = await redis.get(key);
        if (!value) return null;
        
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      } else {
        const cached = memoryCache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
          memoryCache.delete(key);
          return null;
        }
        
        return cached.value;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async del(key) {
    try {
      if (redis && redisConnected) {
        await redis.del(key);
      } else {
        memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      memoryCache.delete(key);
      return true;
    }
  },

  async clearPattern(pattern) {
    try {
      if (redis && redisConnected) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        memoryCache.clear();
      }
      return true;
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
      memoryCache.clear();
      return true;
    }
  },

  async hset(key, field, value, ttl = 300) {
    try {
      if (redis && redisConnected) {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        await redis.hset(key, field, serializedValue);
        await redis.expire(key, ttl);
        return true;
      } else {
        const hashKey = `${key}:${field}`;
        memoryCache.set(hashKey, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });
        return true;
      }
    } catch (error) {
      logger.error('Cache hset error:', error);
      return false;
    }
  },

  async hget(key, field) {
    try {
      if (redis && redisConnected) {
        const value = await redis.hget(key, field);
        if (!value) return null;
        
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      } else {
        const hashKey = `${key}:${field}`;
        const cached = memoryCache.get(hashKey);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
          memoryCache.delete(hashKey);
          return null;
        }
        
        return cached.value;
      }
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  },

  async hgetall(key) {
    try {
      if (redis && redisConnected) {
        const hash = await redis.hgetall(key);
        const result = {};
        
        for (const [field, value] of Object.entries(hash)) {
          try {
            result[field] = JSON.parse(value);
          } catch {
            result[field] = value;
          }
        }
        
        return result;
      } else {
        return {};
      }
    } catch (error) {
      logger.error('Cache hgetall error:', error);
      return {};
    }
  },

  async publish(channel, message) {
    try {
      if (redis && redisConnected) {
        const serializedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
        await redis.publish(channel, serializedMessage);
        return true;
      } else {
        return true;
      }
    } catch (error) {
      logger.error('Redis publish error:', error);
      return false;
    }
  },

  subscribe(channel, callback) {
    if (redis && redisConnected) {
      const subscriber = new Redis(redisConfig);
      
      subscriber.subscribe(channel, (err) => {
        if (err) {
          logger.error('Redis subscribe error:', err);
          return;
        }
        logger.info(`Subscribed to Redis channel: ${channel}`);
      });

      subscriber.on('message', (chan, message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch {
          callback(message);
        }
      });

      return subscriber;
    } else {
      return {
        unsubscribe: () => {},
        on: () => {}
      };
    }
  }
};

module.exports = {
  redis,
  cacheUtils,
  redisConnected: () => redisConnected
};
