import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('玩家指令')
    .addSubcommand(sub =>
      sub.setName('help')
        .setDescription('顯示所有 /player 子指令說明')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'help') {
      await interaction.reply({
        ephemeral: true,
        content: [
          '**📘 /player 指令說明**',
          '🔹 `/player start` - 建立你的玩家帳號（如果尚未建立）',
          '🔹 `/player profile_me` - 查看自己的帳戶與企業資料',
          '🔹 `/player profile_lookup` - 查詢其他公開玩家資料',
          '🔹 `/player private_set` - 設定隱私選項',
          '🔹 `/player private_show` - 查看你的隱私設定'
        ].join('\n')
      });
    }
  }
};
