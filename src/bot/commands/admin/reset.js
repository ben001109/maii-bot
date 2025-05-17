// 📁 src/bot/commands/admin/reset.js

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { deletePlayer, deleteAllPlayersAllGuilds } from '../../../services/playerService.js';
import { logger } from '../../utils/Logging.js';
import { redis } from '../../../redis/redisClient.js'; // 請確認路徑正確
import { isAdmin } from '../../utils/adminControl.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const config = require('../../../config/config.json');

// ====== 直接硬編碼超級管理員 ======
const SUPER_ADMINS = ['520857472223674369']; // 請填自己的 Discord ID
// ==================================================

export default {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('【管理員專用】重置玩家、伺服器或全服資料')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('重置單一玩家資料')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('要重置的目標用戶')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('guild')
        .setDescription('（尚未支援）重置本伺服器所有玩家資料')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('【超級管理員/指定管理員】重置全服所有玩家資料')
    ),

  /**
   * /reset 指令入口
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const adminId = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    // 官方權限檢查
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ 僅限管理員操作',
        ephemeral: true
      });
    }

    try {
      // reset user
      if (subcommand === 'user') {
        const target = interaction.options.getUser('user');
        if (!target) {
          return interaction.reply({
            content: '❌ 請提供要重置的目標用戶。',
            ephemeral: true
          });
        }
        await deletePlayer(target.id);
        logger.warn(`[RESET][USER] ${adminId} 重置了 ${target.id} 的玩家資料`);
        return interaction.reply({
          content: `✅ 已成功重置 <@${target.id}> 的帳號資料！`,
          ephemeral: true
        });
      }

      // reset guild (尚未支援)
      if (subcommand === 'guild') {
        return interaction.reply({
          content: '⚠️ 目前尚未支援「僅重置本伺服器玩家」功能，僅能使用 `/reset all` 進行全服重置。\n如需支援此功能，請聯絡開發者。',
          ephemeral: true
        });
      }

      // reset all（超級/指定管理員）
      if (subcommand === 'all') {
        if (!(SUPER_ADMINS.includes(adminId) || await isAdmin(guildId, adminId, config))) {
          return interaction.reply({
            content: '❌ 你不是超級管理員或本伺服器指定管理員，不能進行全服重置！',
            ephemeral: true
          });
        }
        await deleteAllPlayersAllGuilds();
        logger.error(`[RESET][ALL] 管理員 ${adminId} 重置了全服所有玩家資料！`);
        return interaction.reply({
          content: '⚠️ 已清空全服所有玩家資料！',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: '❌ 不支援的重置類型。',
        ephemeral: true
      });

    } catch (err) {
      const errorMsg = `[RESET][${subcommand}] 發生錯誤：${err instanceof Error ? err.message : JSON.stringify(err)}\n${err.stack ?? ''}`;
      logger.error(errorMsg);
      return interaction.reply({
        content: `❌ 重置失敗，請稍後再試。\n\`\`\`\n${err.message ?? err}\n\`\`\``,
        ephemeral: true
      });
    }
  }
};