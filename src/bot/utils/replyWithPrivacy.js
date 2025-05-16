export async function replyWithPrivacy(interaction, player, contentOrOptions) {
  const isEphemeral = player?.privacy?.replyVisibility !== 'public';

  const options = typeof contentOrOptions === 'string'
    ? { content: contentOrOptions }
    : contentOrOptions;

  // 加入 ephemeral 設定
  options.ephemeral = isEphemeral;

  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.followUp(options);
    }
      return await interaction.reply(options);
  } catch (err) {
    console.error('❌ replyWithPrivacy 回覆失敗', err);
  }
}