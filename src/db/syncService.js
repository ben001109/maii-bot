import { redis } from '../redis/redisClient.js';
import { prisma } from './prismaClient.js';

/**
 * 把 Redis 中所有 player + enterprise 同步到 PostgreSQL
 */
export async function syncRedisToPostgres() {
  console.log('🟡 開始 Redis → PostgreSQL 同步作業...');

  const keys = await redis.keys('player:*');
  let playerCount = 0;
  let enterpriseCount = 0;

  for (const playerKey of keys) {
    const playerDataRaw = await redis.get(playerKey);
    if (!playerDataRaw) continue;

    const playerData = JSON.parse(playerDataRaw);
    const discordId = playerData.discordId;

    // 1️⃣ 同步 Player 資料
    const pgPlayer = await prisma.player.upsert({
      where: { discordId },
      update: { money: playerData.money },
      create: {
        discordId,
        money: playerData.money
      }
    });

    // 2️⃣ 同步 Enterprise 資料
    for (const entId of playerData.enterprises) {
      const entDataRaw = await redis.get(`enterprise:${entId}`);
      if (!entDataRaw) continue;

      const entData = JSON.parse(entDataRaw);

      await prisma.enterprise.upsert({
        where: { id: entData.id },
        update: {
          name: entData.name,
          type: entData.type,
          level: entData.level,
          income: entData.income,
          createdAt: new Date(entData.createdAt),
          playerId: pgPlayer.id
        },
        create: {
          id: entData.id,
          name: entData.name,
          type: entData.type,
          level: entData.level,
          income: entData.income,
          createdAt: new Date(entData.createdAt),
          playerId: pgPlayer.id
        }
      });

      enterpriseCount++;
    }

    playerCount++;
  }

  console.log(`✅ 同步完成：同步 ${playerCount} 位玩家、${enterpriseCount} 間企業`);
  return { playerCount, enterpriseCount };
}
