import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('enterprise-create')
    .setDescription('創建你的第一家企業！'),

  async execute(interaction) {
    await interaction.reply({
      content: `🎉 你已經成功創建了「Maii 餐廳」！`,
      ephemeral: true
    });
  }
};
