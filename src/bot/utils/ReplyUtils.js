// 📁 src/bot/utils/ReplyUtils.js

/**
 * 回覆錯誤訊息，根據互動狀態選擇 reply 或 followUp
 * @param {CommandInteraction} interaction Discord interaction
 * @param {string|Object} options 文字或 Discord 回覆物件（content, embeds, etc.）
 */
export async function replyWithError(interaction, options) {
  const payload = typeof options === 'string' ? { content: options } : options;

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ ...payload, ephemeral: true });
    } else {
      await interaction.reply({ ...payload, ephemeral: true });
    }
  } catch (err) {
    console.error('[ReplyUtils] 回覆錯誤時發生例外：', err);
  }
}