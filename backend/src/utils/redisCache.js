const Redis = require('ioredis');
const NodeCache = require('node-cache');

class HybridCache {
  constructor() {
    this.useRedis = process.env.REDIS_URL && process.env.USE_REDIS === 'true';
    this.memoryCache = new NodeCache({ stdTTL: 300 }); // 5 minutes default
    this.redisConnectionAttempted = false;
    
    if (this.useRedis) {
      this.initializeRedis();
    } else {
      console.log('ℹ️ Redis disabled, using memory cache only');
    }
  }

  initializeRedis() {
    if (this.redisConnectionAttempted) return;
    this.redisConnectionAttempted = true;

    try {
      this.redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        maxLoadingTimeout: 5000,
        retryDelayOnClusterDown: 300,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1
      });
      
      this.redis.on('error', (err) => {
        if (!this.redisErrorLogged) {
          console.warn('⚠️ Redis connection failed, using memory cache:', err.message);
          this.redisErrorLogged = true;
        }
        this.useRedis = false;
      });
      
      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.redisErrorLogged = false;
      });

      this.redis.on('ready', () => {
        console.log('✅ Redis ready for use');
      });

      this.redis.on('close', () => {
        console.warn('⚠️ Redis connection closed');
        this.useRedis = false;
      });

      this.redis.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });
      
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, using memory cache:', error.message);
      this.useRedis = false;
    }
  }

  async get(key) {
    try {
      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.memoryCache.get(key);
      }
    } catch (error) {
      // Silently fallback to memory cache
      return this.memoryCache.get(key);
    }
  }

  async set(key, value, ttl = 300) {
    try {
      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } else {
        this.memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      // Silently fallback to memory cache
      this.memoryCache.set(key, value, ttl);
    }
  }

  async del(key) {
    try {
      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        await this.redis.del(key);
      } else {
        this.memoryCache.del(key);
      }
    } catch (error) {
      // Silently fallback to memory cache
      this.memoryCache.del(key);
    }
  }

  async clear(pattern = null) {
    try {
      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        if (pattern) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.flushdb();
        }
      } else {
        if (pattern) {
          const keys = this.memoryCache.keys();
          const matchingKeys = keys.filter(key => key.includes(pattern));
          matchingKeys.forEach(key => this.memoryCache.del(key));
        } else {
          this.memoryCache.flushAll();
        }
      }
    } catch (error) {
      // Silently fallback to memory cache
      this.memoryCache.flushAll();
    }
  }

  async getStats() {
    try {
      if (this.useRedis && this.redis && this.redis.status === 'ready') {
        const info = await this.redis.info();
        const keys = await this.redis.dbsize();
        return {
          type: 'redis',
          keys,
          info: info.split('\r\n').slice(0, 10).join('\n') // Basic info
        };
      } else {
        const stats = this.memoryCache.getStats();
        return {
          type: 'memory',
          keys: stats.keys,
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hits / (stats.hits + stats.misses)
        };
      }
    } catch (error) {
      return { 
        type: 'memory', 
        error: error.message,
        keys: 0,
        hits: 0,
        misses: 0,
        hitRate: 0
      };
    }
  }

  // Cache middleware cho Express
  middleware(ttl = 300) {
    return async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      const key = `__express__${req.originalUrl || req.url}`;
      
      try {
        const cachedResponse = await this.get(key);
        if (cachedResponse) {
          return res.send(cachedResponse);
        }

        // Override res.send to cache the response
        const originalSend = res.send;
        res.send = async function(body) {
          await this.set(key, body, ttl);
          originalSend.call(this, body);
        }.bind(this);

        next();
      } catch (error) {
        // Silently continue without caching
        next();
      }
    };
  }
}

// Singleton instance
const hybridCache = new HybridCache();

module.exports = hybridCache; 