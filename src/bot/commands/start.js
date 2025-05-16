// 📁 src/bot/commands/start.js
import { SlashCommandBuilder } from 'discord.js';
import { getOrCreatePlayer } from '../../services/playerService.js';
import { logger } from '../utils/Logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('建立玩家帳號（若尚未存在）'),

  async execute(interaction) {
    const discordId = interaction.user.id;

    try {
      const player = await getOrCreatePlayer(discordId);

      logger.info(`[START] ${discordId} 建立/取得帳號，初始金額 $${player.money}`);

      await interaction.reply({
        content: [
          `✅ 帳號已啟用：<@${discordId}>`,
          `💰 初始資金：$${player.money}`
        ].join('\n'),
        ephemeral: true
      });

    } catch (err) {
      logger.error(`[START] 建立玩家錯誤：${discordId}`, err);

      const errorMsg = { content: '❌ 建立帳號時發生錯誤', ephemeral: true };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
};