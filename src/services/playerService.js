// 📁 src/services/playerService.js
import { redis } from '../redis/redisClient.js';
import { logger } from '../bot/utils/Logging.js';

export async function getOrCreatePlayer(discordId) {
  try {
    const key = `player:${discordId}`;
    let data = await redis.get(key);

    if (data) return JSON.parse(data);

    const newPlayer = {
      discordId,
      money: 500,
      enterprises: []
    };

    await redis.set(key, JSON.stringify(newPlayer));
    logger.info(`[Redis] 新玩家建立 ${discordId}`);
    return newPlayer;
  } catch (err) {
    logger.error(`[Redis] getOrCreatePlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}

export async function getPlayer(discordId) {
  try {
    const key = `player:${discordId}`;
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

export async function updatePlayer(discordId, playerData) {
  try {
    const key = `player:${discordId}`;
    await redis.set(key, JSON.stringify(playerData));
    logger.debug(`[Redis] 更新玩家資料 ${discordId}`);
  } catch (err) {
    logger.error(`[Redis] updatePlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}

export async function deletePlayer(discordId) {
  try {
    await redis.del(`player:${discordId}`);
    logger.warn(`[Redis] 已刪除玩家 ${discordId}`);
  } catch (err) {
    logger.error(`[Redis] deletePlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}
