import { SlashCommandBuilder } from 'discord.js';
import { addCard } from '../../src/kanban/index.js';

export const name = 'kanbanadd';

export function execute(text, assign) {
  return addCard(text, assign);
}

export const slashCommand = {
  data: new SlashCommandBuilder()
    .setName('kanban')
    .setDescription('看板操作')
    .addSubcommand((cmd) =>
      cmd
        .setName('add')
        .setDescription('新增卡片')
        .addStringOption((o) =>
          o.setName('text').setDescription('內容').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('assign').setDescription('指派給').setRequired(true),
        ),
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'add') {
      await interaction.reply('未知指令');
      return;
    }
    const text = interaction.options.getString('text');
    const assign = interaction.options.getString('assign');
    const result = addCard(text, assign);
    await interaction.reply(JSON.stringify(result));
  },
};
