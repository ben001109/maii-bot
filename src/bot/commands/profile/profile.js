import { SlashCommandBuilder } from 'discord.js';
import { getOrCreatePlayer } from '../../../services/playerService.js';
import { getEnterprisesByPlayer } from '../../../services/enterpriseService.js';
import { logger } from '../../utils/Logging.js';
import { replyWithPrivacy } from '../../utils/replyWithPrivacy.js'; // ✅ 引入 replyWithPrivacy

// 工具：格式化玩家資料（加上 privacy 控制）
function formatPlayerProfile(user, player, enterprises, privacy) {
  let content = `👤 玩家：<@${user.id}>\n`;

  if (privacy.profileVisibility?.money !== false) {
    const funds = player.money?.toLocaleString() ?? 0;
    content += `💰 資金：$${funds}\n`;
  } else {
    content += '💰 資金：已隱藏\n';
  }

  if (privacy.profileVisibility?.enterprises !== false) {
    if (enterprises.length > 0) {
      content += `\n🏢 擁有企業 (${enterprises.length}):\n`;
      content += enterprises.map((e, i) =>
        `  ${i + 1}. **${e.name}** (${e.type}) Lv.${e.level}｜收入：$${e.income}/hr`
      ).join('\n');
    } else {
      content += '\n🏢 尚未擁有任何企業';
    }
  } else {
    content += '\n🏢 企業資訊：已隱藏';
  }

  return content;
}

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('查看你的帳戶資訊和企業列表'),

  async execute(interaction) {
    try {
      const user = interaction.user;
      const discordId = user.id;

      const player = await getOrCreatePlayer(discordId);
      const enterprises = await getEnterprisesByPlayer(discordId);
      const privacy = player.privacy ?? {};

      const profileMsg = formatPlayerProfile(user, player, enterprises, privacy);

      // ✅ 修正：傳入 player 物件給 replyWithPrivacy
      await replyWithPrivacy(interaction, player, {
        content: profileMsg
      });

    } catch (err) {
      logger.error(`[PROFILE] Error fetching profile for ${interaction.user.id}`, err);

      const errorMsg = { content: '❌ 取得個人資料時發生錯誤', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
};