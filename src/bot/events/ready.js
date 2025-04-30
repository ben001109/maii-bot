import { Events } from 'discord.js';
import { redis } from '../../redis/redisClient.js';
import { prisma } from '../../db/prismaClient.js';
import { syncAllGuildCommands } from '../utils/CommandSync.js';
import { logger } from '../utils/Logging.js'; // 若你想使用 logger 取代 console

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      logger.info(`✅ Bot 上線囉！登入為 ${client.user.tag}`);
      logger.debug('🧪 ready.js execute: 開始');

      const pong = await redis.ping();
      logger.info(`🔗 Redis 回應：${pong}`);

      await prisma.$connect();
      logger.info('🔗 PostgreSQL（Prisma）已連線');

      logger.debug('🧪 ready.js execute: 結束');
      logger.info(`開始同步指令：GUILD ${guildId}`);
      await syncAllGuildCommands(client);
      logger.info('✅ 指令同步完成');
    } catch (err) {
      logger.error('❌ [execute] 內部錯誤', err);
    }
  }
};
