// src/bot/index.js

import { Client, GatewayIntentBits, Events } from 'discord.js';
import { createRequire } from 'node:module';
import { redis } from '../redis/redisClient.js';
import { prisma } from '../db/prismaClient.js';
import { syncAllGuildCommands } from './utils/CommandSync.js';
import {logger} from './utils/Logger.js';
import {loadSlashCommands} from './utils/handler/CommandHandler.js';
import {config} from '../config/index.js';
import {loadEventHandlers} from './utils/handler/EventHandler.js';
import {setupScheduledTasks} from './utils/scheduler/TaskScheduler.js';
import {initializeDatabaseConnection} from '../db/initialize.js';
import {initializeRedisConnection} from '../redis/initialize.js';

// 全域客戶端實例
let client;

/**
 * 啟動 Discord 機器人
 * @returns {Promise<void>}
 */
export async function startBot() {
  try {
    // 初始化資料庫連接
    await initializeDatabaseConnection();
    await initializeRedisConnection();

    // 創建 Discord 客戶端
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    // 載入事件處理器
    loadEventHandlers(client);

    // 載入指令
    await loadSlashCommands(client);

    // 登入機器人
    await client.login(config.DISCORD_TOKEN);

    // 同步指令到伺服器
    await syncAllGuildCommands(client);

    // 設置定時任務
    setupScheduledTasks(client);

    logger.info(`機器人已成功啟動，登入為 ${client.user.tag}`);

    // 設置機器人狀態
    client.user.setActivity(`正在管理經濟系統 | /help`, {type: 'PLAYING'});
  } catch (error) {
    logger.error('啟動過程中發生錯誤:', error);
    throw error;
  }
}

/**
 * 安全關閉機器人
 */
export async function shutdownBot() {
  try {
    logger.info('正在關閉機器人...');

    // 關閉資料庫連接
    await prisma.$disconnect();
    await redis.quit();

    // 如果客戶端存在，執行登出
    if (client) {
      await client.destroy();
    }

    logger.info('機器人已安全關閉');
  } catch (error) {
    logger.error('關閉過程中發生錯誤:', error);
    process.exit(1);
  }
}

// 處理進程終止信號
process.on('SIGINT', shutdownBot);
process.on('SIGTERM', shutdownBot);

/**
 * MAII-Bot Discord Client
 * Economic simulation game bot with player management and enterprise features
 */
class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for the Discord client
   * @private
   */
  setupEventListeners() {
    // When client is ready
    this.client.once(Events.ClientReady, async (client) => {
      logger.info(`Bot logged in as ${client.user.tag}`);

      try {
        // Load all slash commands
        await loadSlashCommands(this.client);

        // Sync commands with Discord API
        await syncAllGuildCommands(this.client);

        logger.info('All commands loaded and synced successfully');
      } catch (error) {
        logger.error('Failed to initialize commands:', error);
      }
    });

    // Handle interactions (slash commands)
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isCommand()) return;

      const command = this.client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Command not found: ${interaction.commandName}`);
        return;
      }

      try {
        await command.execute(interaction, {client: this.client, prisma, redis});
      } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);

        // Reply with error if interaction hasn't been replied to yet
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'There was an error executing this command!',
            ephemeral: true
          });
        }
      }
    });

    // Handle errors
    this.client.on(Events.Error, (error) => {
      logger.error('Discord client error:', error);
    });
  }

  /**
   * Start the bot
   */
  async start() {
    try {
      // Initialize database connections
      await redis.connect();
      logger.info('Redis connected');

      // Login to Discord
      await this.client.login(config.discord.token);
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  /**
   * Gracefully shutdown the bot
   */
  async shutdown() {
    logger.info('Shutting down bot...');

    try {
      // Disconnect from services
      await redis.disconnect();
      await prisma.$disconnect();

      // Destroy Discord client
      this.client.destroy();

      logger.info('Bot shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

export const bot = new DiscordBot();
export default bot;

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