import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getOrCreatePlayer, getPlayer } from '../../../services/playerService.js';
import { getEnterprisesByPlayer } from '../../../services/enterpriseService.js';
import { logger } from '../../utils/Logging.js';
import { replyWithPrivacy } from '../../utils/replyWithPrivacy.js';

// 工具：格式化玩家資料（加上 privacy 控制）
function formatPlayerProfile(user, player, enterprises, privacy, isSelf = true) {
  let content = `👤 玩家：<@${user.id}>\n`;

  // 若是查自己，一律顯示完整資訊
  const showMoney = isSelf || privacy.profileVisibility?.money !== false;
  const showEnterprises = isSelf || privacy.profileVisibility?.enterprises !== false;

  if (showMoney) {
    const funds = player.money?.toLocaleString() ?? 0;
    content += `💰 資金：$${funds}\n`;
  } else {
    content += '💰 資金：已隱藏\n';
  }

  if (showEnterprises) {
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

  // 只有查別人才顯示這個提示（且必須真的有資料被隱藏）
  if (!isSelf && (!showMoney || !showEnterprises)) {
    content += '\n\n🔒 對方部分資料已設為私人，只有本人能看到完整訊息。';
  }
  return content;
}

export default {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('玩家指令')
    .addSubcommand(sub =>
      sub.setName('profile_me')
        .setDescription('查看自己的帳戶資訊')
    )
    .addSubcommand(sub =>
      sub.setName('profile_lookup')
        .setDescription('查詢其他玩家的公開資訊')
        .addUserOption(opt =>
          opt.setName('target')
            .setDescription('要查詢的目標')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();

      if (sub === 'profile_me') {
        // 查看自己
        const user = interaction.user;
        const discordId = user.id;

        const player = await getOrCreatePlayer(discordId);
        const enterprises = await getEnterprisesByPlayer(discordId);
        const privacy = player.privacy ?? {};

        const profileMsg = formatPlayerProfile(user, player, enterprises, privacy, true);

        await replyWithPrivacy(interaction, player, {
          content: profileMsg
        });

      } else if (sub === 'profile_lookup') {
        // 查詢別人
        const targetUser = interaction.options.getUser('target');
        const targetId = targetUser.id;

        // 取得目標玩家
        const player = await getPlayer(targetId);
        if (!player) {
          return await interaction.reply({ content: '❌ 找不到這個玩家。', ephemeral: true });
        }
        const privacy = player.privacy ?? {};

        // 檢查 searchable 權限
        if (privacy.searchable === false) {
          return await interaction.reply({ content: '🔒 此玩家設定為不可查詢。', ephemeral: true });
        }

        const enterprises = await getEnterprisesByPlayer(targetId);
        const profileMsg = formatPlayerProfile(targetUser, player, enterprises, privacy, false);

        // 依照 replyVisibility 回傳方式
        const ephemeral = privacy.replyVisibility === 'private';
        await interaction.reply({ content: profileMsg, ephemeral });
      }
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