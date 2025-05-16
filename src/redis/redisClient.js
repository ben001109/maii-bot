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