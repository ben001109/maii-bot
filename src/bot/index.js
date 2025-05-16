// src/bot/index.js

import { Client, GatewayIntentBits, Events } from 'discord.js';
import { createRequire } from 'node:module';
import { redis } from '../redis/redisClient.js';
import { prisma } from '../db/prismaClient.js';
import { syncAllGuildCommands } from './utils/CommandSync.js';
import { logger } from './utils/Logging.js';
import { loadSlashCommands } from './utils/SlashHandler.js';
import './commands/enterprise/create.js'; // 具體指令模組

const require = createRequire(import.meta.url);
const config = require('../config/config.json');

// === 建立 Discord Client ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// === 機器人初始化 ===
async function handleBotReady() {
  logger.debug('🧪 Bot 初始化中');

  try {
    logger.info(`✅ Bot 上線囉！登入為 ${client.user.tag}`);

    await loadSlashCommands(client);
    logger.info('✅ 指令載入完成');

    const pong = await redis.ping();
    logger.info(`🔗 Redis 回應：${pong}`);

    await prisma.$connect();
    await prisma.$executeRaw`SELECT 1`;
    logger.info('🔗 PostgreSQL（Prisma）已連線');

    const guildIds = client.guilds.cache.map(g => g.id).join(', ');
    logger.info(`開始同步指令：Guild ${guildIds}`);
    await syncAllGuildCommands(client);

    logger.info('✅ 指令同步完成');
  } catch (err) {
    logger.error('❌ 初始化時發生錯誤', err instanceof Error ? err.message : err);
  } finally {
    logger.debug('🧪 Bot 初始化完成');
  }
}

// === 指令處理器 ===
async function handleInteraction(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands?.get(interaction.commandName);
  if (!command) {
    return interaction.reply({ content: '❓ 找不到此指令', ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error(`❌ 執行指令 ${interaction.commandName} 時發生錯誤`, err);
    const errorMsg = { content: '🚨 執行指令時發生錯誤', ephemeral: true };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorMsg);
    } else {
      await interaction.reply(errorMsg);
    }
  }
}

// === 事件綁定 ===
client.once(Events.ClientReady, handleBotReady);
client.on(Events.InteractionCreate, handleInteraction);

// === 登入 ===
client.login(config.discordToken);