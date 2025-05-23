import { SlashCommandBuilder } from 'discord.js';
import { syncRedisToPostgres } from '../../../db/syncService.js';
import { logger } from '../../utils/Logging.js';
import { createRequire } from 'node:module';
import { redis } from '../../../redis/redisClient.js';
import { isAdmin } from '../../utils/adminControl.js';
import { sendAdminMessage, sendError, sendSyncResult } from '../../utils/ReplyUtils.js';

const require = createRequire(import.meta.url);
const config = require('../../../config/config.json');

export default {
  data: new SlashCommandBuilder()
    .setName('admin-sync')
    .setDescription('🛠️ 管理員專用：將 Redis 中的資料同步到 PostgreSQL')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('只同步指定使用者')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('dry_run')
        .setDescription('僅模擬同步過程（不會寫入資料庫）')
        .setRequired(false)         
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    if (!(await isAdmin(guildId, userId, config))) {
      logger.warn(`[ADMIN-SYNC] 未授權使用者嘗試執行同步：${userId}`);
      return sendAdminMessage(interaction, '🚫 你沒有權限使用這個指令。');
    }

    await interaction.deferReply({ ephemeral: true });
    await sendSyncResult(interaction, ['⏳ 資料同步中，請稍候...']);

    const targetUser = interaction.options.getUser('user');
    const dryRun = interaction.options.getBoolean('dry_run') ?? false;

    let currentPlayer = 0;
    let currentEnterprise = 0;

    const progressCallback = async ({ playerCount, enterpriseCount }) => {
      currentPlayer = playerCount;
      currentEnterprise = enterpriseCount;
      await sendSyncResult(interaction, [
        `⏳ 資料${dryRun ? '模擬' : ''}同步中...`,
        `👥 玩家數：${currentPlayer}`,
        `🏢 企業數：${currentEnterprise}`
      ]);
    };

    try {
      const { playerCount, enterpriseCount } = await syncRedisToPostgres({
        id: targetUser?.id,
        dryRun,
        onProgress: progressCallback
      });

      logger.info(`[ADMIN-SYNC] ${userId} 執行${dryRun ? '模擬' : ''}同步，玩家：${playerCount}，企業：${enterpriseCount}`);

      return sendSyncResult(interaction, [
        `✅ 資料${dryRun ? '模擬' : ''}同步完成！`,
        `👥 玩家數：${playerCount}`,
        `🏢 企業數：${enterpriseCount}`
      ]);
    } catch (err) {
      logger.error(`[ADMIN-SYNC] 同步失敗：${userId}\n${err?.stack ? err.stack : err}`);
      let errorText = '';
      if (process.env.NODE_ENV === 'development') {
        errorText = (err instanceof Error ? (err.stack || err.message) : String(err));
      }
      return interaction.editReply({
        content: `❌ 同步失敗，請稍後再試。\n${errorText}`
      });
    }
  }
};