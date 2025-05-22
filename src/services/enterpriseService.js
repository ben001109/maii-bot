// src/services/enterpriseService.js
import { redis } from '../redis/redisClient.js';
import { getOrCreatePlayer, updatePlayer } from './playerService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 建立新企業
 * @param {string} discordId Discord 使用者 ID
 * @param {string} type 企業類型，預設為 'restaurant'
 * @returns {Promise<Object>} 新創立的企業資料
 */
export async function createEnterprise(discordId, type = 'restaurant', name = null) {
  const player = await getOrCreatePlayer(discordId);
  const enterprise = generateEnterprise(discordId, type, name);

  await redis.set(getEnterpriseKey(enterprise.id), JSON.stringify(enterprise));

  player.enterprises.push(enterprise.id);
  await updatePlayer(discordId, player);

  return enterprise;
}

/**
 * 取得企業資料
 * @param {string} id 企業 ID
 * @returns {Promise<Object|null>}
 */
export async function getEnterprise(id) {
  const raw = await redis.get(getEnterpriseKey(id));
  return raw ? JSON.parse(raw) : null;
}

/**
 * 取得某位玩家所有企業資料
 * @param {string} discordId Discord 使用者 ID
 * @returns {Promise<Array<Object>>}
 */
export async function getEnterprisesByPlayer(discordId) {
  const player = await getOrCreatePlayer(discordId);
  const enterprises = await Promise.all(player.enterprises.map(getEnterprise));
  return enterprises.filter(Boolean);
}

/**
 * 產生企業資料物件
 * @param {string} owner Discord 使用者 ID
 * @param {string} type 企業類型
 * @param {string|null} name 企業名稱（可選）
 * @returns {Object}
 */
function generateEnterprise(owner, type, name = null) {
  return {
    id: uuidv4(),
    owner,
    name: name ?? `鷗麥 ${type}`,
    type,
    level: 1,
    income: 100,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Redis 企業鍵名生成器
 * @param {string} id 企業 ID
 * @returns {string}
 */
function getEnterpriseKey(id) {
  return `enterprise:${id}`;
}