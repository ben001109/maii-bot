import { SlashCommandBuilder } from 'discord.js';
import { initAccount } from '../../economy/account.js';

export const name = 'init';

export function execute(id) {
  return initAccount(id);
}

export const slashCommand = {
  data: new SlashCommandBuilder()
    .setName('init')
    .setDescription('初始化玩家資料'),
  async execute(interaction, locale) {
    const created = initAccount(interaction.user.id);
    const key = created ? 'init_success' : 'init_exists';
    await interaction.reply(locale(key));
  },
};
