import { SlashCommandBuilder } from 'discord.js';

export const name = 'ping';

export function execute() {
  return 'pong';
}

export const slashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction, locale) {
    await interaction.reply(locale('pong'));
  },
};
