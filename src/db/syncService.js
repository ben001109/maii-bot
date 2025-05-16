import { redis } from '../redis/redisClient.js';
import { prisma } from './prismaClient.js';
import { logger } from '../bot/utils/Logging.js';

async function syncPlayer(discordId, dryRun = false) {
  const playerKey = `player:${discordId}`;
  const raw = await redis.get(playerKey);
  if (!raw) return { playerSynced: false, enterpriseSynced: 0 };

  let playerData;
  try {
    playerData = JSON.parse(raw);
  } catch (err) {
    logger.warn(`[Sync] 玩家資料 JSON 解析錯誤：${playerKey}`, err);
    return { playerSynced: false, enterpriseSynced: 0 };
  }

  const { money, enterprises = [] } = playerData;

  if (dryRun) {
    logger.info(`[DryRun] 將同步玩家 ${discordId}（金錢：${money}，企業數：${enterprises.length}）`);
  }

  let pgPlayer = { id: 'dry-run-id' };
  if (!dryRun) {
    try {
      pgPlayer = await prisma.player.upsert({
        where: { discordId },
        update: { money },
        create: { discordId, money }
      });
    } catch (err) {
      logger.error(`[Sync] 寫入玩家失敗：${discordId}`, err);
      return { playerSynced: false, enterpriseSynced: 0 };
    }
  }

  let enterpriseCount = 0;
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

    if (dryRun) {
      logger.info(`[DryRun] 將同步企業 ${id}（名稱：${name}，類型：${type}）`);
      enterpriseCount++;
    } else {
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
  }

  return { playerSynced: true, enterpriseSynced: enterpriseCount };
}

/**
 * 把 Redis 中所有 player + enterprise 同步到 PostgreSQL
 * @returns {Promise<{ playerCount: number, enterpriseCount: number }>}
 */
export async function syncRedisToPostgres({ dryRun = false, id = null } = {}) {
  logger.info(`${dryRun ? '🧪 DryRun 模式：模擬同步作業中...' : '🟡 開始 Redis → PostgreSQL 同步作業...'}`);

  const keys = id ? [`player:${id}`] : await redis.keys('player:*');
  let playerCount = 0;
  let enterpriseCount = 0;

  for (const key of keys) {
    const discordId = key.split(':')[1];
    const result = await syncPlayer(discordId, dryRun);
    if (result.playerSynced) playerCount++;
    enterpriseCount += result.enterpriseSynced;
  }

  logger.info(`✅ 同步${dryRun ? '模擬' : ''}完成：處理 ${playerCount} 位玩家、${enterpriseCount} 間企業`);
  return { playerCount, enterpriseCount };
}