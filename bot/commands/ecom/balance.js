import { SlashCommandBuilder } from 'discord.js';
import { getBalance } from '../../handler/ecom/account.js';
import { format } from '../../handler/ecom/currency.js';

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
    await interaction.reply(locale('balance', { amount: format(balance) }));
  },
};
