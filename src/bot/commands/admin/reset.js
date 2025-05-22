// 📁 src/bot/commands/admin/reset.js

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { deletePlayer, deleteAllPlayersAllGuilds, deletePlayersByGuild } from '../../../services/playerService.js';
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
        embeds: [{
          description: '❌ 僅限管理員操作',
          color: 0xFF0000
        }],
        ephemeral: true
      });
    }

    try {
      // reset user
      if (subcommand === 'user') {
        const target = interaction.options.getUser('user');
        if (!target) {
          return interaction.reply({
            embeds: [{
              description: '❌ 請提供要重置的目標用戶。',
              color: 0xFF0000
            }],
            ephemeral: true
          });
        }
        await deletePlayer(target.id);
        logger.warn(`[RESET][USER] ${adminId} 重置了 ${target.id} 的玩家資料`);
        return interaction.reply({
          embeds: [{
            description: `✅ 已成功重置 <@${target.id}> 的帳號資料！`,
            color: 0x00FF00
          }],
          ephemeral: true
        });
      }

      // reset guild
      if (subcommand === 'guild') {
        await deletePlayersByGuild(guildId);
        logger.warn(`[RESET][GUILD] ${adminId} 重置了伺服器 ${guildId} 的所有玩家資料`);
        return interaction.reply({
          embeds: [{
            description: `⚠️ 已成功重置本伺服器所有玩家資料（ID: ${guildId}）`,
            color: 0xFFFF00
          }],
          ephemeral: true
        });
      }

      // reset all（超級/指定管理員）
      if (subcommand === 'all') {
        if (!(SUPER_ADMINS.includes(adminId) || await isAdmin(guildId, adminId, config))) {
          return interaction.reply({
            embeds: [{
              description: '❌ 你不是超級管理員或本伺服器指定管理員，不能進行全服重置！',
              color: 0xFF0000
            }],
            ephemeral: true
          });
        }
        await deleteAllPlayersAllGuilds();
        logger.error(`[RESET][ALL] 管理員 ${adminId} 重置了全服所有玩家資料！`);
        return interaction.reply({
          embeds: [{
            description: '⚠️ 已清空全服所有玩家資料！',
            color: 0xFFFF00
          }],
          ephemeral: true
        });
      }

      return interaction.reply({
        embeds: [{
          description: '❌ 不支援的重置類型。',
          color: 0xFF0000
        }],
        ephemeral: true
      });

    } catch (err) {
      const errorMsg = `[RESET][${subcommand}] 發生錯誤：${err instanceof Error ? err.message : JSON.stringify(err)}\n${err.stack ?? ''}`;
      logger.error(errorMsg);
      return interaction.reply({
        embeds: [{
          description: `❌ 重置失敗，請稍後再試。\n\`\`\`\n${err.message ?? err}\n\`\`\``,
          color: 0xFF0000
        }],
        ephemeral: true
      });
    }
  }
};