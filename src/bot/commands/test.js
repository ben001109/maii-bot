// 📁 src/bot/commands/admin/remove.js
import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/Logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('移除某個項目')
    .addStringOption(option =>
      option.setName('項目')
            .setDescription('要移除的項目名稱')
            .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const item = interaction.options.getString('項目');
      // 執行移除邏輯
      // ...

      await interaction.reply({ content: `✅ 已成功移除項目：${item}`, ephemeral: true });

    } catch (err) {
      try {
        // 主動 log stack
        logger.error('[ADMIN] 指令出錯', err?.stack ? err.stack : err);

        const errorReply = { content: '❌ 指令出錯', ephemeral: true };
        if (interaction.user.id === '520857472223674369') {
          errorReply.content += `\n\`\`\`\n${err?.stack ? err.stack : err}\n\`\`\``;
        }
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(errorReply);
        } else {
          await interaction.reply(errorReply);
        }
      } catch (err2) {
        // 最後保險，任何 error 都印到 console
        console.error('[ADMIN][FATAL] 處理錯誤時又報錯', err2?.stack ? err2.stack : err2);
      }
    }
  }
};