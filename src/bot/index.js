// src/bot/index.js

import { Client, GatewayIntentBits, Events } from 'discord.js';
import { createRequire } from 'node:module';
import { redis } from '../redis/redisClient.js';
import { prisma } from '../db/prismaClient.js';
import { syncAllGuildCommands } from './utils/CommandSync.js';
import { logger } from './utils/Logging.js';
import { loadSlashCommands } from './utils/handler/SlashHandler.js';
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

    await loadSlashCommands(client).catch(err => {
      logger.error(`loadSlashCommands 執行失敗\n${err?.stack || err}`);
      throw err;
    });
    logger.info('✅ 指令載入完成');

    const pong = await redis.ping().catch(err => {
      logger.error(`redis.ping() 失敗\n${err?.stack || err}`);
      throw err;
    });
    logger.info(`🔗 Redis 回應：${pong}`);

    await prisma.$connect().catch(err => {
      logger.error(`prisma.$connect() 失敗\n${err?.stack || err}`);
      throw err;
    });
    await prisma.$executeRaw`SELECT 1`.catch(err => {
      logger.error(`prisma.$executeRaw 失敗\n${err?.stack || err}`);
      throw err;
    });
    logger.info('🔗 PostgreSQL（Prisma）已連線');

    const guildIds = client.guilds.cache.map(g => g.id).join(', ');
    logger.info(`開始同步指令：Guild ${guildIds}`);

    await syncAllGuildCommands(client).catch(err => {
      logger.error(`syncAllGuildCommands 執行失敗\n${err?.stack || err}`);
      throw err;
    });
    logger.info('✅ 指令同步完成');
  } catch (err) {
    if (err instanceof Error) {
      logger.error('❌ 初始化時發生錯誤', err.stack || err);
    } else {
      logger.error('❌ 初始化時發生錯誤', err);
    }
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
    // 印出完整 stack trace 到 logger 及 console
    try {
      if (err?.stack) {
        logger.error(`❌ 執行指令 ${interaction.commandName} 時發生錯誤\n${err.stack}`);
        // 同步印到 console
        console.error(`❌ 執行指令 ${interaction.commandName} 時發生錯誤\n${err.stack}`);
      } else {
        logger.error(`❌ 執行指令 ${interaction.commandName} 時發生錯誤`, err);
        console.error(`❌ 執行指令 ${interaction.commandName} 時發生錯誤`, err);
      }
    } catch (logErr) {
      // fallback: 如果 logger 本身出錯
      console.error('logger.error 發生錯誤', logErr);
      if (err?.stack) {
        console.error(`❌ 執行指令 ${interaction.commandName} 時發生錯誤\n${err.stack}`);
      } else {
        console.error(`❌ 執行指令 ${interaction.commandName} 時發生錯誤`, err);
      }
    }
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

// === 全域未捕獲異常處理 ===
process.on('unhandledRejection', (reason, promise) => {
  try {
    const msg = reason?.stack ? `未捕獲 Promise 拒絕: \n${reason.stack}` : `未捕獲 Promise 拒絕: ${reason}`;
    logger.error(msg);
    console.error(msg);
  } catch (logErr) {
    console.error('logger.error 發生錯誤', logErr);
    if (reason?.stack) {
      console.error(`未捕獲 Promise 拒絕: \n${reason.stack}`);
    } else {
      console.error("未捕獲 Promise 拒絕:", reason);
    }
  }
});

process.on('uncaughtException', (err) => {
  try {
    const msg = err?.stack ? `未捕獲例外: \n${err.stack}` : `未捕獲例外: ${err}`;
    logger.error(msg);
    console.error(msg);
  } catch (logErr) {
    console.error('logger.error 發生錯誤', logErr);
    if (err?.stack) {
      console.error(`未捕獲例外: \n${err.stack}`);
    } else {
      console.error("未捕獲例外:", err);
    }
  }
});

// === 登入 ===
client.login(config.discordToken);