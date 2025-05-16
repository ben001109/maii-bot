import { SlashCommandBuilder } from 'discord.js';
import { getOrCreatePlayer } from '../../services/playerService.js';
import { getEnterprisesByPlayer } from '../../services/enterpriseService.js';
import { logger } from '../utils/Logging.js';

// 工具：格式化玩家資料
function formatPlayerProfile(user, player, enterprises) {
  const funds = player.money?.toLocaleString() ?? 0;
  let content = `👤 玩家：<@${user.id}>\n💰 資金：$${funds}\n`;

  if (enterprises.length > 0) {
    content += `\n🏢 擁有企業 (${enterprises.length}):\n`;
    content += enterprises.map((e, i) =>
      `  ${i + 1}. **${e.name}** (${e.type}) Lv.${e.level}｜收入：$${e.income}/hr`
    ).join('\n');
  } else {
    content += "\n🏢 尚未擁有任何企業";
  }

  return content;
}

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('查看你的帳戶資訊和企業列表'),
    // .addUserOption(option =>
    //   option.setName('user').setDescription('要查詢的對象').setRequired(false)
    // ) // ← 之後可支援查詢其他人

  async execute(interaction) {
    try {
      // const target = interaction.options.getUser('user') || interaction.user; // 之後支援
      const user = interaction.user;
      const discordId = user.id;

      const player = await getOrCreatePlayer(discordId);
      const enterprises = await getEnterprisesByPlayer(discordId);

      const profileMsg = formatPlayerProfile(user, player, enterprises);

      await interaction.reply({
        content: profileMsg,
        ephemeral: true
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