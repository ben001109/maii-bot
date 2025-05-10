import { SlashCommandBuilder } from 'discord.js';
import { getOrCreatePlayer } from '../../services/playerService.js';
import { getEnterprisesByPlayer } from '../../services/enterpriseService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your account info and enterprise list'),

  /**
   * Executes the profile command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      const discordId = interaction.user.id;
      const player = await getOrCreatePlayer(discordId);
      const enterprises = await getEnterprisesByPlayer(discordId);

      const entList = enterprises.map((e, i) =>
        `🏢 ${i + 1}. **${e.name}** (${e.type}) Lv.${e.level} 💰Income: ${e.income}/hr`
      ).join('\n') || '(No enterprises owned)';

      await interaction.reply({
        content: `👤 Player: <@${interaction.user.id}>\n💰 Funds: $${player.money}\n\n${entList}`,
        ephemeral: true
      });
    } catch (err) {
      logger.error(`[PROFILE] Error fetching profile for ${interaction.user.id}`, err);
      await interaction.reply({ content: '❌ Error fetching profile', ephemeral: true });
    }
  }
};
