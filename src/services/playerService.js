// 📁 src/services/playerService.js
import { redis } from '../redis/redisClient.js';
import { logger } from '../bot/utils/Logging.js';

/**
 * 建立或取得玩家資料
 * @param {string} discordId Discord 使用者 ID
 * @returns {Promise<Object>} 玩家資料物件
 */
export async function getOrCreatePlayer(discordId) {
  const key = getPlayerKey(discordId);
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const newPlayer = createDefaultPlayer(discordId);
    await redis.set(key, JSON.stringify(newPlayer));
    logger.info(`[Redis] 新玩家建立 ${discordId}`);
    return newPlayer;
  } catch (err) {
    logger.error(`[Redis] getOrCreatePlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}

/**
 * 取得玩家資料（不建立）
 * @param {string} discordId Discord 使用者 ID
 * @returns {Promise<Object|null>} 玩家資料或 null
 */
export async function getPlayer(discordId) {
  const key = getPlayerKey(discordId);
  try {
    const data = await redis.get(key);
    if (!data) {
      logger.warn(`[Redis] 找不到玩家 ${discordId}`);
      return null;
    }
    return JSON.parse(data);
  } catch (err) {
    logger.error(`[Redis] getPlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}

/**
 * 更新玩家資料
 * @param {string} discordId Discord 使用者 ID
 * @param {Object} playerData 要儲存的玩家資料
 * @returns {Promise<void>}
 */
export async function updatePlayer(discordId, playerData) {
  const key = getPlayerKey(discordId);
  try {
    await redis.set(key, JSON.stringify(playerData));
    logger.debug(`[Redis] 更新玩家資料 ${discordId}`);
  } catch (err) {
    logger.error(`[Redis] updatePlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}

/**
 * 刪除玩家資料
 * @param {string} discordId Discord 使用者 ID
 * @returns {Promise<void>}
 */
export async function deletePlayer(discordId) {
  const key = getPlayerKey(discordId);
  try {
    await redis.del(key);
    logger.warn(`[Redis] 已刪除玩家 ${discordId}`);
  } catch (err) {
    logger.error(`[Redis] deletePlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}

// === 私有工具區 ===

/**
 * 預設玩家資料模板
 * @param {string} discordId
 * @returns {Object}
 */
function createDefaultPlayer(discordId) {
  return {
    discordId,
    money: 500,
    enterprises: [],
  };
}

/**
 * 建立 Redis key
 * @param {string} discordId
 * @returns {string}
 */
function getPlayerKey(discordId) {
  return `player:${discordId}`;
}