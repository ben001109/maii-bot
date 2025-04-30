import { redis } from '../redis/redisClient.js';
import { getOrCreatePlayer, updatePlayer } from './playerService.js';
import { v4 as uuidv4 } from 'uuid';

export async function createEnterprise(discordId, type = 'restaurant') {
  const player = await getOrCreatePlayer(discordId);

  const enterpriseId = uuidv4();
  const enterpriseKey = `enterprise:${enterpriseId}`;

  const newEnterprise = {
    id: enterpriseId,
    owner: discordId,
    name: `鷗麥 ${type}`,
    type,
    level: 1,
    income: 100,
    createdAt: new Date().toISOString()
  };

  // 寫入 enterprise 內容
  await redis.set(enterpriseKey, JSON.stringify(newEnterprise));

  // 加入玩家資料中
  player.enterprises.push(enterpriseId);
  await updatePlayer(discordId, player);

  return newEnterprise;
}

export async function getEnterprise(id) {
  const data = await redis.get(`enterprise:${id}`);
  return data ? JSON.parse(data) : null;
}

export async function getEnterprisesByPlayer(discordId) {
  const player = await getOrCreatePlayer(discordId);
  const list = [];

  for (const id of player.enterprises) {
    const ent = await getEnterprise(id);
    if (ent) list.push(ent);
  }

  return list;
}
