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
        content: `✅ 已啟動帳號：<@${interaction.user.id}>\n💰 初始資金：$${player.money}`,
        ephemeral: true
      });
    } catch (err) {
      logger.error(`[START] 建立玩家錯誤：${discordId}`, err);
      await interaction.reply({ content: '❌ 建立帳號時發生錯誤', ephemeral: true });
    }
  }
};
