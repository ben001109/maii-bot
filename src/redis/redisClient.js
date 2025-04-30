import Redis from 'ioredis';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const config = require('../config/config.json');

// 建立 Redis client
export const redis = new Redis({
  host: config.redis.host || '127.0.0.1',
  port: config.redis.port || 6379
});
redis.on('connect', () => {
  console.log('🔗 Redis 已連線');
});
redis.on('error', (err) => {
  console.error('❌ Redis 連線失敗', err);
});
redis.on('ready', () => {
  console.log('🔗 Redis 已準備就緒');
});
redis.on('end', () => {
  console.log('🔗 Redis 已斷線');
});
redis.on('reconnecting', () => {
  console.log('🔗 Redis 正在重新連線');
});
redis.on('close', () => {
  console.log('🔗 Redis 已關閉');
});
redis.on('warning', (warning) => {
  console.warn('🔗 Redis 警告:', warning);
});
redis.on('info', (info) => {
  console.log('🔗 Redis 資訊:', info);
});
redis.on('message', (channel, message) => {
  console.log(`🔗 Redis 訊息: ${channel} - ${message}`);
});
redis.on('subscribe', (channel, count) => {
  console.log(`🔗 Redis 訂閱: ${channel} - 訂閱數量: ${count}`);
});
redis.on('unsubscribe', (channel, count) => {
  console.log(`🔗 Redis 取消訂閱: ${channel} - 訂閱數量: ${count}`);
});
redis.on('psubscribe', (pattern, count) => {
  console.log(`🔗 Redis 模式訂閱: ${pattern} - 訂閱數量: ${count}`);
});
redis.on('punsubscribe', (pattern, count) => {
  console.log(`🔗 Redis 模式取消訂閱: ${pattern} - 訂閱數量: ${count}`);
});
