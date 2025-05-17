import { SlashCommandBuilder } from 'discord.js';
import { createEnterprise } from '../../../services/enterpriseService.js';
import { logger } from '../../utils/Logging.js';
import { getOrCreatePlayer } from '../../../services/playerService.js';
import { replyWithPrivacy } from '../../utils/replyWithPrivacy.js';

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
    .setName('enterprise')
    .setDescription('企業相關指令')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('創建你的第一家企業！')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('企業類型')
            .setRequired(true)
            .addChoices(
              { name: '農場', value: 'farm' },
              { name: '食品工廠', value: 'factory' },
              { name: '物流公司', value: 'logistics' },
              { name: '設備製造', value: 'equipment' }
            )
        )
    ),

  /**
   * Executes the enterprise command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    if (sub === 'create') {
      const player = await getOrCreatePlayer(discordId);
      const type = interaction.options.getString('type');
      try {
        const enterprise = await createEnterprise(discordId, type);
        await replyWithPrivacy(interaction, player, formatCreateMsg(enterprise));
        logger.info(`[ENTERPRISE-CREATE] ${discordId} 創建企業 ${enterprise.id}`);
      } catch (error) {
        logger.error(`[ENTERPRISE-CREATE] ${discordId} 創建企業失敗: ${error?.stack ? error.stack : error}`);

        let msgContent = '❌ 創建企業時發生錯誤，請稍後再試。';
        if (interaction.user.id === '520857472223674369') {
          msgContent += `\n\n\`\`\`\n${error?.stack ? error.stack : error}\n\`\`\``;
        }
        await replyWithPrivacy(interaction, player, msgContent);
      }
    }
  }
};