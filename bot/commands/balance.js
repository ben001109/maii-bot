import { SlashCommandBuilder } from 'discord.js';
import { getBalance } from '../../economy/account.js';
import { format } from '../../economy/currency.js';

export const name = 'balance';

export function execute(id) {
  return getBalance(id);
}

export const slashCommand = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your account balance'),
  async execute(interaction, locale) {
    const balance = getBalance(interaction.user.id);
    const text = locale('balance');
    const message =
      typeof text === 'function'
        ? text(format(balance))
        : `${text} ${format(balance)}`;
    await interaction.reply(message);
  },
};
