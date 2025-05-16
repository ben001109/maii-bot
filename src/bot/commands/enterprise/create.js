import { SlashCommandBuilder } from 'discord.js';
import { createEnterprise } from '../../../services/enterpriseService.js';
import { logger } from '../../utils/Logging.js';

/**
 * 格式化創建結果訊息
 */
function formatCreateMsg(enterprise) {
  return [
    '🎉 你已成功創建企業！',
    `🏢 名稱：**${enterprise.name}**`,
    `📦 類型：${enterprise.type}`,
    `📈 等級：${enterprise.level}`,
    `💰 每小時收入：$${enterprise.income}`,
    `🕒 創立時間：${new Date(enterprise.createdAt).toLocaleString()}`
  ].join('\n');
}

export default {
  data: new SlashCommandBuilder()
    .setName('enterprise-create')
    .setDescription('創建你的第一家企業！'),
    // .addStringOption(option =>
    //   option.setName('type')
    //     .setDescription('企業類型')
    //     .setRequired(false)
    // ) // 未來可放開支援多類型

  /**
   * Executes the enterprise-create command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const discordId = interaction.user.id;
    // const type = interaction.options.getString('type') || 'restaurant'; // 未來參數

    try {
      const enterprise = await createEnterprise(discordId, 'restaurant');
      await interaction.reply({
        content: formatCreateMsg(enterprise),
        ephemeral: true
      });
      logger.info(`[ENTERPRISE-CREATE] ${discordId} 創建企業 ${enterprise.id}`);
    } catch (error) {
      logger.error(`[ENTERPRISE-CREATE] ${discordId} 創建企業失敗:`, error);
      const msg = { content: '❌ 創建企業時發生錯誤，請稍後再試。', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  }
};