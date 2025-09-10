const redis = require('redis');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = parseInt(process.env.REDIS_MAX_RETRIES) || 5;
    this.retryDelay = parseInt(process.env.REDIS_RETRY_DELAY) || 1000;
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalOperations: 0
    };
  }

  // Initialize Redis connection
  async connect() {
    try {
      // Redis configuration
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        family: 4 // Force IPv4
      };

      // Add TLS configuration for Redis Cloud or secured instances
      if (process.env.REDIS_TLS === 'true') {
        redisConfig.tls = {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        };
      }

      // Create Redis client
      this.client = redis.createClient(redisConfig);

      // Set up event handlers
      this.setupEventHandlers();

      // Connect to Redis
      await this.client.connect();
      
      this.isConnected = true;
      this.retryAttempts = 0;
      
      console.log('✅ Redis cache connected successfully');
      console.log(`📊 Redis info: ${redisConfig.host}:${redisConfig.port}, DB: ${redisConfig.db}`);
      
      // Test connection with ping
      const pong = await this.client.ping();
      if (pong !== 'PONG') {
        throw new Error('Redis ping failed');
      }

      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.isConnected = false;
      this.handleConnectionError(error);
      return false;
    }
  }

  // Set up Redis event handlers
  setupEventHandlers() {
    this.client.on('error', (error) => {
      console.error('Redis error:', error);
      this.stats.errors++;
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('🔄 Redis connecting...');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis ready for operations');
      this.isConnected = true;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    this.client.on('end', () => {
      console.log('❌ Redis connection ended');
      this.isConnected = false;
    });
  }

  // Handle connection errors with retry logic
  async handleConnectionError(error) {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      console.log(`🔄 Retrying Redis connection (attempt ${this.retryAttempts}/${this.maxRetries})...`);
      
      setTimeout(async () => {
        await this.connect();
      }, this.retryDelay * this.retryAttempts);
    } else {
      console.error(`❌ Max Redis retry attempts (${this.maxRetries}) reached. Cache disabled.`);
    }
  }

  // Check if Redis is available
  isAvailable() {
    return this.isConnected && this.client && this.client.isReady;
  }

  // Generate cache key with namespace
  generateKey(namespace, key) {
    const prefix = process.env.REDIS_KEY_PREFIX || 'crm';
    return `${prefix}:${namespace}:${key}`;
  }

  // Set cache with TTL
  async set(namespace, key, value, ttl = null) {
    if (!this.isAvailable()) {
      console.warn('⚠️ Cache unavailable, skipping set operation');
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const serializedValue = JSON.stringify(value);
      
      const defaultTTL = parseInt(process.env.REDIS_DEFAULT_TTL) || 3600; // 1 hour
      const expirationTime = ttl || defaultTTL;

      await this.client.setEx(cacheKey, expirationTime, serializedValue);
      
      this.stats.sets++;
      this.stats.totalOperations++;
      
      console.log(`💾 Cache SET: ${cacheKey} (TTL: ${expirationTime}s)`);
      return true;
    } catch (error) {
      console.error('Cache SET error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // Get cache value
  async get(namespace, key) {
    if (!this.isAvailable()) {
      console.warn('⚠️ Cache unavailable, skipping get operation');
      this.stats.misses++;
      return null;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const value = await this.client.get(cacheKey);
      
      this.stats.totalOperations++;
      
      if (value === null) {
        this.stats.misses++;
        console.log(`🔍 Cache MISS: ${cacheKey}`);
        return null;
      }

      this.stats.hits++;
      console.log(`✅ Cache HIT: ${cacheKey}`);
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Cache GET error:', error);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  // Delete cache entry
  async delete(namespace, key) {
    if (!this.isAvailable()) {
      console.warn('⚠️ Cache unavailable, skipping delete operation');
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await this.client.del(cacheKey);
      
      this.stats.deletes++;
      this.stats.totalOperations++;
      
      console.log(`🗑️ Cache DELETE: ${cacheKey} (deleted: ${result})`);
      return result > 0;
    } catch (error) {
      console.error('Cache DELETE error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // Delete multiple keys by pattern
  async deletePattern(namespace, pattern = '*') {
    if (!this.isAvailable()) {
      console.warn('⚠️ Cache unavailable, skipping pattern delete');
      return 0;
    }

    try {
      const searchPattern = this.generateKey(namespace, pattern);
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length === 0) {
        console.log(`🔍 No keys found for pattern: ${searchPattern}`);
        return 0;
      }

      const result = await this.client.del(keys);
      
      this.stats.deletes += result;
      this.stats.totalOperations++;
      
      console.log(`🗑️ Cache PATTERN DELETE: ${searchPattern} (deleted: ${result} keys)`);
      return result;
    } catch (error) {
      console.error('Cache PATTERN DELETE error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  // Check if key exists
  async exists(namespace, key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const result = await this.client.exists(cacheKey);
      
      this.stats.totalOperations++;
      return result === 1;
    } catch (error) {
      console.error('Cache EXISTS error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // Get TTL for a key
  async getTTL(namespace, key) {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const ttl = await this.client.ttl(cacheKey);
      
      this.stats.totalOperations++;
      return ttl;
    } catch (error) {
      console.error('Cache TTL error:', error);
      this.stats.errors++;
      return -1;
    }
  }

  // Extend TTL for a key
  async extendTTL(namespace, key, additionalTime) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const currentTTL = await this.client.ttl(cacheKey);
      
      if (currentTTL > 0) {
        const newTTL = currentTTL + additionalTime;
        const result = await this.client.expire(cacheKey, newTTL);
        
        this.stats.totalOperations++;
        console.log(`⏰ Cache TTL EXTENDED: ${cacheKey} (new TTL: ${newTTL}s)`);
        return result === 1;
      }
      
      return false;
    } catch (error) {
      console.error('Cache EXTEND TTL error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // Increment counter
  async increment(namespace, key, amount = 1, ttl = null) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      let result;
      
      if (amount === 1) {
        result = await this.client.incr(cacheKey);
      } else {
        result = await this.client.incrBy(cacheKey, amount);
      }
      
      // Set TTL if provided and this is a new key
      if (ttl && result === amount) {
        await this.client.expire(cacheKey, ttl);
      }
      
      this.stats.totalOperations++;
      console.log(`📈 Cache INCREMENT: ${cacheKey} by ${amount} (result: ${result})`);
      return result;
    } catch (error) {
      console.error('Cache INCREMENT error:', error);
      this.stats.errors++;
      return null;
    }
  }

  // Set with expiration timestamp
  async setWithExpiration(namespace, key, value, expirationTimestamp) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const serializedValue = JSON.stringify(value);
      
      const result = await this.client.set(cacheKey, serializedValue, {
        EXAT: Math.floor(expirationTimestamp / 1000)
      });
      
      this.stats.sets++;
      this.stats.totalOperations++;
      
      console.log(`💾 Cache SET with expiration: ${cacheKey} (expires at: ${new Date(expirationTimestamp)})`);
      return result === 'OK';
    } catch (error) {
      console.error('Cache SET with expiration error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // Cache wrapper for functions
  async wrap(namespace, key, fn, ttl = null) {
    // Try to get from cache first
    let result = await this.get(namespace, key);
    
    if (result !== null) {
      console.log(`⚡ Cache wrapper HIT: ${namespace}:${key}`);
      return result;
    }

    // Execute function and cache result
    try {
      console.log(`🔄 Cache wrapper MISS: ${namespace}:${key} - executing function`);
      result = await fn();
      
      if (result !== null && result !== undefined) {
        await this.set(namespace, key, result, ttl);
      }
      
      return result;
    } catch (error) {
      console.error(`Cache wrapper execution error for ${namespace}:${key}:`, error);
      throw error;
    }
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.stats.totalOperations > 0 
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      isConnected: this.isConnected,
      isAvailable: this.isAvailable(),
      uptime: process.uptime()
    };
  }

  // Clear all statistics
  clearStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalOperations: 0
    };
    console.log('📊 Cache statistics cleared');
  }

  // Get Redis info
  async getInfo() {
    if (!this.isAvailable()) {
      return { error: 'Redis not available' };
    }

    try {
      const info = await this.client.info();
      const keyspace = await this.client.info('keyspace');
      const memory = await this.client.info('memory');
      
      return {
        connected: this.isConnected,
        info: info,
        keyspace: keyspace,
        memory: memory,
        stats: this.getStats()
      };
    } catch (error) {
      console.error('Error getting Redis info:', error);
      return { error: error.message };
    }
  }

  // Flush all cache (use with caution)
  async flushAll() {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client.flushDb();
      console.log('🧹 Cache flushed successfully');
      this.clearStats();
      return true;
    } catch (error) {
      console.error('Cache FLUSH error:', error);
      this.stats.errors++;
      return false;
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('✅ Redis disconnected gracefully');
      } catch (error) {
        console.error('Error disconnecting Redis:', error);
        this.client.disconnect();
      }
    }
    this.isConnected = false;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isAvailable()) {
        return {
          status: 'unhealthy',
          message: 'Redis not connected',
          timestamp: new Date().toISOString()
        };
      }

      const start = Date.now();
      await this.client.ping();
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        message: 'Redis responding normally',
        responseTime: `${responseTime}ms`,
        stats: this.getStats(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Auto-connect on module load if Redis is configured
if (process.env.REDIS_HOST || process.env.NODE_ENV === 'production') {
  cacheService.connect().catch(error => {
    console.warn('⚠️ Redis auto-connect failed:', error.message);
  });
}

module.exports = cacheService;
