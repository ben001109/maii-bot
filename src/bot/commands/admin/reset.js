// 📁 src/bot/commands/admin/reset.js

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { deletePlayer } from '../../../services/playerService.js';
import { logger } from '../../utils/Logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('【管理員專用】重置指定玩家帳號資料')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('要重置的目標用戶')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * 執行重置指令
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const adminId = interaction.user.id;
    const target = interaction.options.getUser('user');
    const targetId = target.id;

    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ 僅限管理員操作', ephemeral: true });
    }

    try {
      await deletePlayer(targetId);
      logger.warn(`[RESET] ${adminId} 重置了 ${targetId} 的玩家資料`);
      await interaction.reply({
        content: `✅ 已成功重置 <@${targetId}> 的帳號資料！`,
        ephemeral: true
      });
    } catch (err) {
      logger.error(`[RESET] 重置玩家 ${targetId} 失敗`, err);
      await interaction.reply({
        content: '❌ 重置失敗，請稍後再試。',
        ephemeral: true
      });
    }
  }
};