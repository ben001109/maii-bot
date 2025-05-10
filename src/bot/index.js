// src/index.js

import { Client, GatewayIntentBits, Events } from 'discord.js';
import { createRequire } from 'node:module';

// 連線工具
import { redis } from '../redis/redisClient.js';
import { prisma } from '../db/prismaClient.js';

// 同步與日誌
import { syncAllGuildCommands } from './utils/CommandSync.js';
import { logger } from './utils/Logging.js';

// Slash commands loader
import { loadSlashCommands } from './utils/SlashHandler.js';
// 各個指令模組（依需求引入）
import './commands/enterprise/create.js';

const require = createRequire(import.meta.url);
const config = require('../config/config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// 在 ready 事件裡一次搞定初始化
client.once(Events.ClientReady, async () => {
  logger.debug('🧪 Bot 初始化中');
  logger.info(`✅ Bot 上線囉！登入為 ${client.user.tag}`);

  try {
    // 1. 先載入所有 slash commands
    await loadSlashCommands(client);
    logger.info('✅ 指令載入完成');

    // 2. 測試 Redis 連線
    const pong = await redis.ping();
    logger.info(`🔗 Redis 回應：${pong}`);

    // 3. 連接並測試 Prisma（PostgreSQL）
    await prisma.$connect();
    await prisma.$executeRaw`SELECT 1`;
    logger.info('🔗 PostgreSQL（Prisma）已連線');

    // 4. 同步 commands 到所有 guild
    const guildIds = client.guilds.cache.map(g => g.id).join(', ');
    logger.info(`開始同步指令：Guild ${guildIds}`);
    await syncAllGuildCommands(client);
    logger.info('✅ 指令同步完成');
  } catch (err) {
    // 錯誤處理
    if (err instanceof Error) {
      logger.error('❌ 初始化時發生錯誤', err.message);
    } else {
      logger.error('❌ 初始化時發生錯誤', err);
    }
  }
  logger.debug('🧪 Bot 初始化完成');
});

// 處理 slash command 互動
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error('❌ 指令執行錯誤', err);
    await interaction.reply({
      content: '執行指令時發生錯誤',
      ephemeral: true,
    });
  }
});

// 最後登入 Discord
client.login(config.discordToken);
