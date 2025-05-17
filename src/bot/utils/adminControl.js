

import { redis } from '../../redis/redisClient.js';
import { logger } from '../utils/Logging.js';

const GLOBAL_KEY = 'admin:global';
const GUILD_KEY = (guildId) => `admin:guild:${guildId}`;

// 型態修復工具
async function ensureSet(key) {
  const type = await redis.type(key);
  if (type !== 'set') {
    logger.error(`[ADMIN-CONTROL] ${key} 型態錯誤，當前為：${type}`);
    if (type === 'zset') {
      const members = await redis.zrange(key, 0, -1);
      if (members.length > 0) {
        await redis.del(key);
        await redis.sadd(key, ...members);
        logger.info(`[ADMIN-CONTROL] 已將 ${key} 從 zset 轉為 set`);
      } else {
        await redis.del(key);
        logger.info(`[ADMIN-CONTROL] 已刪除空的 zset key：${key}`);
      }
    } else {
      await redis.del(key);ß
      logger.info(`[ADMIN-CONTROL] 已刪除非 set/zset 型態的 key：${key}`);
    }
  }
}

// 全域管理員操作
export async function addGlobalAdmin(userId) {
  await ensureSet(GLOBAL_KEY);
  return redis.sadd(GLOBAL_KEY, userId);
}
export async function removeGlobalAdmin(userId) {
  await ensureSet(GLOBAL_KEY);
  return redis.srem(GLOBAL_KEY, userId);
}
export async function listGlobalAdmins() {
  await ensureSet(GLOBAL_KEY);
  return redis.smembers(GLOBAL_KEY);
}

// DC 伺服器管理員操作
export async function addGuildAdmin(guildId, userId) {
  const key = GUILD_KEY(guildId);
  await ensureSet(key);
  return redis.sadd(key, userId);
}
export async function removeGuildAdmin(guildId, userId) {
  const key = GUILD_KEY(guildId);
  await ensureSet(key);
  return redis.srem(key, userId);
}
export async function listGuildAdmins(guildId) {
  const key = GUILD_KEY(guildId);
  await ensureSet(key);
  return redis.smembers(key);
}

// 權限檢查
export async function isAdmin(guildId, userId, config) {
  // 先查 guild admin，再查全域 admin，再 fallback config
  const key = GUILD_KEY(guildId);
  await ensureSet(key);
  const guildAdmins = await redis.smembers(key);
  if (guildAdmins?.includes(userId)) return true;

  await ensureSet(GLOBAL_KEY);
  const globalAdmins = await redis.smembers(GLOBAL_KEY);
  if (globalAdmins?.includes(userId)) return true;

  // config.adminIds fallback (靜態配置)
  return (config.adminIds || []).includes(userId);
}