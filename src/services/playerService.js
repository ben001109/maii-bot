import util from 'node:util';
// 📁 src/services/playerService.js
import { redis } from '../redis/redisClient.js';
import { logger } from '../bot/utils/Logging.js';

/**
 * 建立或取得玩家資料，保證有完整 privacy 欄位
 * @param {string} discordId Discord 使用者 ID
 * @param {string} guildId Discord 伺服器 ID
 * @returns {Promise<Object>} 玩家資料物件
 */
export async function getOrCreatePlayer(discordId, guildId) {
  const key = getPlayerKey(discordId);
  try {
    const cached = await redis.get(key);
    if (cached) {
      const parsed = ensurePlayerSchema(JSON.parse(cached));
      if (!parsed.guildIds.includes(guildId)) {
        parsed.guildIds.push(guildId);
        await redis.set(key, JSON.stringify(parsed));
      }
      return parsed;
    }
    const newPlayer = createDefaultPlayer(discordId, guildId);
    await redis.set(key, JSON.stringify(newPlayer));
    logger.info(`[Redis] 新玩家建立 ${discordId}`);
    return newPlayer;
  } catch (err) {
    logger.error(`[Redis] getOrCreatePlayer 錯誤 ${discordId}`, err);
    throw err;
  }
}

/**
 * 取得玩家資料（不建立），保證有完整 privacy 欄位
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
    const parsed = ensurePlayerSchema(JSON.parse(data));
    return parsed;
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
    const data = ensurePlayerSchema(playerData);
    await redis.set(key, JSON.stringify(data));
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
 * @param {string} discordIdㄖㄢ
 * @param {string} guildId
 * @returns {Object}
 */
function createDefaultPlayer(discordId, guildId) {
  return {
    discordId,
    guildIds: [guildId],
    money: 1000,
    enterprises: [],
    time: '2025-01-17T00:00:00.000Z',
    cooldowns: {},
    privacy: createDefaultPrivacy(), // 預設隱私欄位
  };
}

/**
 * 預設 privacy 欄位
 * @returns {Object}
 */
function createDefaultPrivacy() {
  return {
    replyVisibility: 'private', // 'private' or 'public'
    profileVisibility: {
      money: true,
      enterprises: true,
    },
    searchable: true,
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

/**
 * 保證玩家資料物件 schema 完整（補齊缺漏欄位）
 * @param {Object} player 玩家物件
 * @returns {Object}
 */
function ensurePlayerSchema(player) {
  if (!player.privacy) player.privacy = createDefaultPrivacy();
  // 🆕 修補 guildIds 欄位
  if (!Array.isArray(player.guildIds)) player.guildIds = [];
  // 處理 profileVisibility 缺漏
  if (!player.privacy.profileVisibility) {
    player.privacy.profileVisibility = { money: true, enterprises: true };
  } else {
    if (typeof player.privacy.profileVisibility.money !== 'boolean')
      player.privacy.profileVisibility.money = true;
    if (typeof player.privacy.profileVisibility.enterprises !== 'boolean')
      player.privacy.profileVisibility.enterprises = true;
  }
  // replyVisibility 與 searchable 預設值
  if (!['private', 'public'].includes(player.privacy.replyVisibility))
    player.privacy.replyVisibility = 'private';
  if (typeof player.privacy.searchable !== 'boolean')
    player.privacy.searchable = true;

  return player;
}
export function fillDefaultPrivacy(privacy) {
  return {
    replyVisibility: privacy?.replyVisibility ?? 'private',
    searchable: !(privacy?.searchable === false), // 預設 true
    profileVisibility: {
      money: !(privacy?.profileVisibility?.money === false),
      enterprises: !(privacy?.profileVisibility?.enterprises === false)
    }
  };
}

// === Guild/All 重置功能 ===

/**
 * 批次刪除所有 player:* 資料（全服玩家重置）
 * 使用 Redis SCAN + DEL 批次處理，transaction 包覆
 */
export async function deleteAllPlayersAllGuilds() {
  const scanAsync = util.promisify(redis.scan).bind(redis);
  const delAsync = util.promisify(redis.del).bind(redis);
  let cursor = '0';
  let keysDeleted = 0;
  do {
    const [nextCursor, keys] = await scanAsync(cursor, 'MATCH', 'player:*', 'COUNT', 1000);
    if (keys.length) {
      // 篩選不包含 admin:guild: 的 keys (保險)
      const filteredKeys = keys.filter(k => !k.startsWith('admin:guild:'));
      if (filteredKeys.length) {
        await delAsync(...filteredKeys);
        keysDeleted += filteredKeys.length;
      }
    }
    cursor = nextCursor;
  } while (cursor !== '0');
  logger.warn(`[Redis] 已刪除全服玩家資料（排除管理員資料），共 ${keysDeleted} 筆`);
}

// guild 重置（若未來有 guild 維度時可實作，暫時只留註解）
// export async function deleteAllPlayersInGuild(guildId) {
//   // 如果有 guild 維度資料，這裡寫 player:${guildId}:* 批次刪除
// }

export async function deletePlayersByGuild(guildId) {
  const scanAsync = util.promisify(redis.scan).bind(redis);
  const delAsync = util.promisify(redis.del).bind(redis);
  const getAsync = util.promisify(redis.get).bind(redis);
  let cursor = '0';
  let keysDeleted = 0;

  do {
    const [nextCursor, keys] = await scanAsync(cursor, 'MATCH', 'player:*', 'COUNT', 1000);
    if (keys.length) {
      for (const key of keys) {
        const data = await getAsync(key);
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed.guildIds) && parsed.guildIds.includes(guildId)) {
            await delAsync(key);
            keysDeleted++;
          }
        } catch (e) {
          logger.warn(`[Redis] 無法解析 ${key}，略過`);
        }
      }
    }
    cursor = nextCursor;
  } while (cursor !== '0');

  logger.warn(`[Redis] 已刪除伺服器 ${guildId} 的玩家資料，共 ${keysDeleted} 筆`);
}

/**
 * 取得所有玩家資料
 * @returns {Promise<Object[]>}
 */
export async function getAllPlayers() {
  const scanAsync = util.promisify(redis.scan).bind(redis);
  const getAsync = util.promisify(redis.get).bind(redis);
  let cursor = '0';
  const results = [];

  do {
    const [nextCursor, keys] = await scanAsync(cursor, 'MATCH', 'player:*', 'COUNT', 1000);
    for (const key of keys) {
      const data = await getAsync(key);
      if (!data) continue;
      try {
        const parsed = ensurePlayerSchema(JSON.parse(data));
        results.push(parsed);
      } catch (e) {
        logger.warn(`[Redis] 略過損毀的玩家資料 ${key}`);
      }
    }
    cursor = nextCursor;
  } while (cursor !== '0');

  return results;
}

/**
 * 直接寫入玩家資料
 * @param {Object} player 完整的玩家物件
 * @returns {Promise<void>}
 */
export async function setPlayer(player) {
  if (!player?.discordId) throw new Error('缺少 discordId');
  const key = getPlayerKey(player.discordId);
  const data = ensurePlayerSchema(player);
  await redis.set(key, JSON.stringify(data));
  logger.debug(`[Redis] 寫入玩家 ${player.discordId}`);
}

/**
 * 對現有玩家物件進行初始化欄位補全
 * @param {Object} player 玩家物件
 * @returns {Object}
 */
export function initializePlayer(player) {
  player.money ??= 1000;
  player.time ??= '2025-01-17T00:00:00.000Z';
  player.enterpriseCreated ??= 0;
  player.cooldowns ??= {};
  player.privacy = fillDefaultPrivacy(player.privacy);
  player.initialized = true;
  return player;
}