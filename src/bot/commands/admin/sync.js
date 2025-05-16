import { SlashCommandBuilder } from 'discord.js';
import { syncRedisToPostgres } from '../../../db/syncService.js';
import { logger } from '../../utils/Logging.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../../../config/config.json');
const ADMIN_IDS = config.adminIds;

if (!Array.isArray(ADMIN_IDS) || ADMIN_IDS.length === 0) {
  logger.warn('[ADMIN-SYNC] 未設定管理員 ID，已禁止同步指令啟用！');
  // 你可以選擇直接 throw new Error(...) 停止 bot 啟動
}

export default {
  data: new SlashCommandBuilder()
    .setName('admin-sync')
    .setDescription('🛠️ 管理員專用：將 Redis 中的資料同步到 PostgreSQL'),

  async execute(interaction) {
    const userId = interaction.user.id;
    if (!ADMIN_IDS.includes(userId)) {
      logger.warn(`[ADMIN-SYNC] 未授權使用者嘗試執行同步：${userId}`);
      return interaction.reply({
        content: '🚫 你沒有權限使用這個指令。',
        ephemeral: true
      });
    }

    try {
      const { playerCount, enterpriseCount } = await syncRedisToPostgres();
      logger.info(`[ADMIN-SYNC] ${userId} 執行資料同步，玩家：${playerCount}，企業：${enterpriseCount}`);
      await interaction.reply({
        content: [
          "✅ 資料同步完成！",
          `👥 玩家數：${playerCount}`,
          `🏢 企業數：${enterpriseCount}`
        ].join('\n'),
        ephemeral: true
      });
    } catch (err) {
      logger.error(`[ADMIN-SYNC] 同步失敗：${userId}`, err);
      const errorText = process.env.NODE_ENV === 'development'
        ? (err instanceof Error ? (err.stack || err.message) : String(err))
        : '';
      await interaction.reply({
        content: `❌ 同步失敗，請稍後再試。\n${errorText}`,
        ephemeral: true
      });
    }
  }
};