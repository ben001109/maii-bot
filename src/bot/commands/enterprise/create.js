import { SlashCommandBuilder } from 'discord.js';
import { createEnterprise } from '../../../services/enterpriseService.js';
import { logger } from '../../utils/Logging.js';
import { getOrCreatePlayer, updatePlayer } from '../../../services/playerService.js';
import { getEphemeralForPlayer } from '../../utils/replyWithPrivacy.js';
import { get } from 'node:http';
import { EconHandler } from '../../utils/handler/ecomHandler.js';

const enterpriseTypeMap = {
  farm: '農場',
  factory: '食品工廠',
  logistics: '物流公司',
  equipment: '設備製造'
};

function getEnterpriseTypeLabel(type) {
  return enterpriseTypeMap[type] ?? type;
}

/**
 * 格式化創建結果訊息
 */
function formatCreateMsg(enterprise, player) {
  return [
    '🎉 你已成功創建企業！',
    `🏢 名稱：**${enterprise.name}**`,
    `📦 類型：${getEnterpriseTypeLabel(enterprise.type)}`,
    `📈 等級：${enterprise.level}`,
    `💰 每小時收入：$${enterprise.income}`,
    `🕒 創立時間：${new Date(enterprise.createdAt).toLocaleString()}`,
    `🔁 創業次數：${player.enterpriseCreated}`
  ].join('\n');
}

export default {
  data: new SlashCommandBuilder()
    .setName('enterprise')
    .setDescription('企業相關指令')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('創建你的企業！')
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
        .addStringOption(option =>
          option.setName('name')
            .setDescription('企業名稱')
            .setRequired(true)
            .setMaxLength(20)
            .setMinLength(2)
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

      const currentTime = new Date(player.time ?? '2025-01-17T00:00:00Z');
      const cooldownUntil = player.cooldowns?.enterpriseCreate
        ? new Date(player.cooldowns.enterpriseCreate)
        : null;

      if (cooldownUntil && currentTime < cooldownUntil) {
        const remainingSec = Math.floor((cooldownUntil - currentTime) / 1000);
        const hrs = Math.floor(remainingSec / 3600);
        const min = Math.floor((remainingSec % 3600) / 60);
        const sec = remainingSec % 60;
        const realSec = Math.floor(remainingSec / 6);
        const realHrs = Math.floor(realSec / 3600);
        const realMin = Math.floor((realSec % 3600) / 60);
        const realS = realSec % 60;
        return interaction.reply({
          embeds: [{
            description: `⌛ 你已經創建過企業了，請等待冷卻結束：**${hrs} 小時 ${min} 分 ${sec} 秒**（現實約 ${realHrs} 小時 ${realMin} 分 ${realS} 秒）後再試。`,
            color: 0xFFA500
          }],
          ephemeral: true
        });
      }

      const startupCost = 1000;
      if ((player.money ?? 0) < startupCost) {
        return interaction.reply({
          embeds: [{
            description: `❌ 創業需要 $${startupCost}，你的資金不足。`,
            color: 0xFF0000
          }],
          ephemeral: true
        });
      }

      // 扣款
      await EconHandler.modifyMoney(discordId, -startupCost);

      const type = interaction.options.getString('type');
      const name = interaction.options.getString('name');
      try {
        const enterprise = await createEnterprise(discordId, type, name);

        player.enterpriseCreated = (player.enterpriseCreated ?? 0) + 1;

        player.cooldowns = player.cooldowns ?? {};
        const nextTime = new Date(currentTime.getTime() + 10800 * 1000); // +3小時
        player.cooldowns.enterpriseCreate = nextTime.toISOString();
        await updatePlayer(discordId, player);

        const embed = {
          description: formatCreateMsg(enterprise, player),
          color: 0x00FF00,
        };
        await interaction.reply({
          embeds: [embed],
          ...getEphemeralForPlayer(player),
        });
        logger.info(`[ENTERPRISE-CREATE] ${discordId} 創建企業 ${enterprise.id}`);
      } catch (error) {
        logger.error(`[ENTERPRISE-CREATE] ${discordId} 創建企業失敗: ${error?.stack ? error.stack : error}`);

        let msgContent = '❌ 創建企業時發生錯誤，請稍後再試。';
        if (interaction.user.id === '520857472223674369') {
          msgContent += `\n\n\`\`\`\n${error?.stack ? error.stack : error}\n\`\`\``;
        }
        const embed = {
          description: msgContent,
          color: 0xFF0000,
        };
        await interaction.reply({
          embeds: [embed],
          ...getEphemeralForPlayer(player),
        });
      }
    }
  }
};