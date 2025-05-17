// 📁 src/bot/commands/admin/remove.js
import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/Logging.js';
import { getOrCreatePlayer } from '../../services/playerService.js';
import { replyWithPrivacy } from '../utils/replyWithPrivacy.js';

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
    const player = await getOrCreatePlayer(interaction.user.id);
    try {
      const item = interaction.options.getString('項目');
      // 執行移除邏輯
      // ...

      await replyWithPrivacy(interaction, player, `✅ 已成功移除項目：${item}`);

    } catch (err) {
      try {
        // 主動 log stack
        logger.error('[ADMIN] 指令出錯', err?.stack ? err.stack : err);

        let msg = '❌ 指令出錯';
        if (interaction.user.id === '520857472223674369') {
          msg += `\n\`\`\`\n${err?.stack ? err.stack : err}\n\`\`\``;
        }
        await replyWithPrivacy(interaction, player, msg);
      } catch (err2) {
        // 最後保險，任何 error 都印到 console
        console.error('[ADMIN][FATAL] 處理錯誤時又報錯', err2?.stack ? err2.stack : err2);
      }
    }
  }
};