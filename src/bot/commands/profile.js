import { SlashCommandBuilder } from 'discord.js';
import { getOrCreatePlayer } from '../../services/playerService.js';
import { getEnterprisesByPlayer } from '../../services/enterpriseService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('查看你的帳號資訊與企業列表'),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const player = await getOrCreatePlayer(discordId);
    const enterprises = await getEnterprisesByPlayer(discordId);

    const entList = enterprises.map((e, i) =>
      `🏢 ${i + 1}. **${e.name}**（${e.type}）Lv.${e.level} 💰收入：${e.income}/hr`
    ).join('\n') || '（尚未擁有企業）';

    await interaction.reply({
      content: `👤 玩家：<@${interaction.user.id}>\n💰 資金：$${player.money}\n\n${entList}`,
      ephemeral: true
    });
  }
};
