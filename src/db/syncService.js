import { redis } from '../redis/redisClient.js';
import { prisma } from './prismaClient.js';
import { logger } from '../bot/utils/Logging.js';

/**
 * 把 Redis 中所有 player + enterprise 同步到 PostgreSQL
 * @returns {Promise<{ playerCount: number, enterpriseCount: number }>}
 */
export async function syncRedisToPostgres() {
  logger.info('🟡 開始 Redis → PostgreSQL 同步作業...');

  const keys = await redis.keys('player:*');
  let playerCount = 0;
  let enterpriseCount = 0;

  for (const playerKey of keys) {
    const raw = await redis.get(playerKey);
    if (!raw) continue;

    let playerData;
    try {
      playerData = JSON.parse(raw);
    } catch (err) {
      logger.warn(`[Sync] 玩家資料 JSON 解析錯誤：${playerKey}`, err);
      continue;
    }

    const { discordId, money, enterprises = [] } = playerData;

    let pgPlayer;
    try {
      pgPlayer = await prisma.player.upsert({
        where: { discordId },
        update: { money },
        create: { discordId, money }
      });
    } catch (err) {
      logger.error(`[Sync] 寫入玩家失敗：${discordId}`, err);
      continue;
    }

    for (const entId of enterprises) {
      const entRaw = await redis.get(`enterprise:${entId}`);
      if (!entRaw) continue;

      let entData;
      try {
        entData = JSON.parse(entRaw);
      } catch (err) {
        logger.warn(`[Sync] 企業資料 JSON 解析錯誤：enterprise:${entId}`, err);
        continue;
      }

      const {
        id, name, type, level, income, createdAt
      } = entData;

      try {
        await prisma.enterprise.upsert({
          where: { id },
          update: {
            name, type, level, income,
            createdAt: new Date(createdAt),
            playerId: pgPlayer.id
          },
          create: {
            id, name, type, level, income,
            createdAt: new Date(createdAt),
            playerId: pgPlayer.id
          }
        });
        enterpriseCount++;
      } catch (err) {
        logger.error(`[Sync] 寫入企業失敗：${id}`, err);
      }
    }

    playerCount++;
  }

  logger.info(`✅ 同步完成：同步 ${playerCount} 位玩家、${enterpriseCount} 間企業`);
  return { playerCount, enterpriseCount };
}