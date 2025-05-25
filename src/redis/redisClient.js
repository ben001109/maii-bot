// 📁 src/redis/redisClient.js
import Redis from 'ioredis';
import { createRequire } from 'node:module';
import { logger } from '../bot/utils/Logging.js';

const require = createRequire(import.meta.url);
const config = require('../config/config.json');

// === Redis 連線設定 ===
const redisConfig = {
  host: config.redis.host || '127.0.0.1',
  port: config.redis.port || 6379,
  // retryStrategy: times => Math.min(times * 50, 2000), // 可加重連策略
};

let redis;
// src/redis/redisClient.js

import Redis from 'ioredis';
import {config} from '../config/index.js';
import {logger} from '../utils/Logger.js';

// Create logger for Redis module
const redisLogger = logger.child({name: 'redis'});

/**
 * Redis client wrapper with enhanced error handling and event logging
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize and connect to Redis
   * @returns {Promise<Redis>} Connected Redis client
   */
  async connect() {
    if (this.client && this.connected) {
      return this.client;
    }

    try {
      this.connectionAttempts++;

      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        username: config.redis.username,
        password: config.redis.password,
        db: config.redis.db,
        retryStrategy: (times) => {
          // Don't retry indefinitely
          if (times >= this.maxRetries) {
            redisLogger.error(`Maximum Redis connection retries (${this.maxRetries}) exceeded`);
            return null; // Stop retrying
          }
          return this.retryDelay;
        }
      });

      this._setupEventHandlers();

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        this.client.once('ready', () => {
          this.connected = true;
          this.connectionAttempts = 0;
          redisLogger.info('Redis connection established');
          resolve();
        });

        this.client.once('error', (err) => {
          reject(err);
        });
      });

      return this.client;
    } catch (error) {
      redisLogger.error('Failed to connect to Redis:', error);

      // Retry connection if under max attempts
      if (this.connectionAttempts < this.maxRetries) {
        redisLogger.info(`Retrying Redis connection (${this.connectionAttempts}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      }

      throw error;
    }
  }

  /**
   * Set up event handlers for the Redis client
   * @private
   */
  _setupEventHandlers() {
    if (!this.client) return;

    this.client.on('error', (error) => {
      this.connected = false;
      redisLogger.error('Redis error:', error);
    });

    this.client.on('reconnecting', () => {
      this.connected = false;
      redisLogger.warn('Redis reconnecting...');
    });

    this.client.on('ready', () => {
      this.connected = true;
      redisLogger.info('Redis ready');
    });

    this.client.on('end', () => {
      this.connected = false;
      redisLogger.info('Redis connection closed');
    });

    // Log warning for unhandled rejections in Redis operations
    this.client.on('warning', (warning) => {
      redisLogger.warn('Redis warning:', warning);
    });
  }

  /**
   * Check if Redis connection is healthy
   * @returns {Promise<boolean>} Connection status
   */
  async ping() {
    try {
      if (!this.client || !this.connected) {
        return false;
      }

      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      redisLogger.error('Redis ping failed:', error);
      return false;
    }
  }

  /**
   * Gracefully disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        this.connected = false;
        redisLogger.info('Redis disconnected');
      } catch (error) {
        redisLogger.error('Error disconnecting from Redis:', error);
        // Force disconnect if quit fails
        this.client.disconnect();
      } finally {
        this.client = null;
      }
    }
  }
}

// Create and export Redis client singleton
export const redis = new RedisClient();
export default redis;
if (process.env.NODE_ENV === 'development') {
  // 開發模式下防止多次實例
  if (!global._redis) {
    global._redis = new Redis(redisConfig);
  }
  redis = global._redis;
} else {
  redis = new Redis(redisConfig);
}

// === Redis 事件監聽 ===
const events = {
  connect: () => logger.info('🔗 Redis 已連線'),
  ready: () => logger.info('✅ Redis 準備就緒'),
  end: () => logger.warn('🔌 Redis 已斷線'),
  close: () => logger.warn('❎ Redis 已關閉'),
  reconnecting: () => logger.info('🔁 Redis 正在重新連線'),
  error: (err) => logger.error('❌ Redis 錯誤', err),
  warning: (warn) => logger.warn('⚠️ Redis 警告', warn),
  info: (info) => logger.info('ℹ️ Redis 資訊', info),
  message: (channel, msg) => logger.debug(`📨 Redis 訊息 | ${channel}: ${msg}`),
  subscribe: (channel, count) => logger.debug(`📡 訂閱：${channel}（共 ${count} 個）`),
  unsubscribe: (channel, count) => logger.debug(`📴 取消訂閱：${channel}（剩 ${count} 個）`),
  psubscribe: (pattern, count) => logger.debug(`📡 模式訂閱：${pattern}（共 ${count} 個）`),
  punsubscribe: (pattern, count) => logger.debug(`📴 模式取消訂閱：${pattern}（剩 ${count} 個）`),
};

for (const [event, handler] of Object.entries(events)) {
  redis.on(event, handler);
}

// === 健康檢查: 定期 ping，避免意外斷線沒發現（可選）
setInterval(() => {
  redis.ping().catch((err) => {
    logger.error('❌ Redis Ping 失敗', err);
  });
}, 30_000); // 30 秒一次

export { redis };