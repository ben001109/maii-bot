// src/bot/index.js

import {Client, Collection, Events, GatewayIntentBits} from 'discord.js';
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import {logger} from '../utils/Logger.js';
import {config} from '../config/config.js';
import {prisma} from '../db/prismaClient.js';
import {redis} from '../redis/redisClient.js';
import {adminManager} from '../models/AdminManager.js';
import {syncAllGuildCommands} from './utils/CommandSync.js';
import {loadSlashCommands} from '../utils/handler/CommandHandler.js';

// 獲取目錄路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers
      ]
    });

      // 命令集合
      this.client.commands = new Collection();

      // 設置事件監聽器
    this.setupEventListeners();
  }

  /**
   * 設置事件監聽器
   * @private
   */
  setupEventListeners() {
      // 當客戶端準備就緒
    this.client.once(Events.ClientReady, async (client) => {
        logger.info(`機器人已上線，登入為 ${client.user.tag}`);

        // 設置機器人狀態
        client.user.setActivity(`正在管理經濟系統 | /help`, {type: 'PLAYING'});
    });

      // 處理互動（斜線命令）
    this.client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

      const command = this.client.commands.get(interaction.commandName);

      if (!command) {
          logger.warn(`找不到命令: ${interaction.commandName}`);
          return interaction.reply({content: '❓ 找不到此命令', ephemeral: true});
      }

      try {
          await command.execute(interaction, {client: this.client, prisma, redis});
      } catch (error) {
          logger.error(`執行命令時發生錯誤: ${interaction.commandName}`, error);

          const errorMessage = '執行命令時發生錯誤。';

          if (interaction.replied || interaction.deferred) {
              await interaction.followUp({
                  content: errorMessage,
                  ephemeral: true
              });
          } else {
              await interaction.reply({
                  content: errorMessage,
                  ephemeral: true
          });
        }
      }
    });

      // 處理錯誤
    this.client.on(Events.Error, (error) => {
        logger.error('Discord 客戶端錯誤:', error);
    });
  }

  /**
   * 啟動機器人
   */
  async start() {
    try {
        logger.info('正在啟動 MAII-Bot...');

        // 連接資料庫
        logger.info('正在連接資料庫...');
        await prisma.$connect();
        logger.info('資料庫連接成功');

        // 連接 Redis
        logger.info('正在連接 Redis...');
      await redis.connect();
        logger.info('Redis 連接成功');

        // 初始化管理員系統
        logger.info('正在初始化管理員系統...');
        await adminManager.initialize();

        // 載入命令
        logger.info('正在載入命令...');
        await loadSlashCommands(this.client);

        // 登入 Discord
        logger.info('正在連接 Discord...');
      await this.client.login(config.discord.token);

        // 同步命令到伺服器
        logger.info('正在同步命令到伺服器...');
        await syncAllGuildCommands(this.client);

        logger.info('MAII-Bot 啟動完成');
    } catch (error) {
        logger.error('啟動機器人失敗:', error);
        throw error;
    }
  }

  /**
   * 優雅關閉機器人
   */
  async shutdown() {
      logger.info('正在關閉 MAII-Bot...');

    try {
        // 斷開 Discord 連接
        logger.info('正在斷開 Discord 連接...');
        this.client.destroy();

        // 斷開 Redis 連接
        logger.info('正在斷開 Redis 連接...');
      await redis.disconnect();

        // 斷開資料庫連接
        logger.info('正在斷開資料庫連接...');
      await prisma.$disconnect();

        logger.info('MAII-Bot 已完全關閉');
    } catch (error) {
        logger.error('關閉過程發生錯誤:', error);
      process.exit(1);
    }
  }
}

// 創建機器人實例
const bot = new DiscordBot();

/**
 * 啟動機器人
 */
export async function startBot() {
    await bot.start();
}

/**
 * 關閉機器人
 */
export async function shutdown() {
    await bot.shutdown();
}

// 處理系統信號，優雅關閉
process.once('SIGINT', () => shutdown());
process.once('SIGTERM', () => shutdown());

// 處理未捕獲的異常
process.on('unhandledRejection', (reason, promise) => {
    const msg = reason?.stack
        ? `未捕獲 Promise 拒絕: \n${reason.stack}`
        : `未捕獲 Promise 拒絕: ${reason}`;
    logger.error(msg);
});

process.on('uncaughtException', (err) => {
    const msg = err?.stack
        ? `未捕獲例外: \n${err.stack}`
        : `未捕獲例外: ${err}`;
    logger.error(msg);
});

export default bot;
