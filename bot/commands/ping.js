export const name = 'ping';
export function execute() {
  return 'pong';
}
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
  async execute(interaction, locale) {
    await interaction.reply(locale('pong'));
  }
};
