// i18n 支援: 格式化訊息內容，可對接 i18n 套件
export function formatMessage(message) {
  // 若是字串則直接傳回；若是 key 則可替換成 i18n 函式如 i18n.t(key)
  // 目前暫為簡易實作，保留擴充點
  return typeof message === 'string' ? message : String(message);
}

import { EmbedBuilder } from 'discord.js';

export async function sendSuccess(interaction, message, ephemeral = true) {
  const embed = new EmbedBuilder()
    .setDescription(`✅ ${formatMessage(message)}`)
    .setColor(0x57F287); // Discord 綠色

  return interaction.reply({
    embeds: [embed],
    ephemeral,
  });
}

export async function defer(interaction, ephemeral = true) {
  if (interaction.deferred || interaction.replied) return;
  return interaction.deferReply({ ephemeral });
}
export async function sendWarning(interaction, message, ephemeral = true) {
  const embed = new EmbedBuilder()
    .setDescription(`⚠️ ${formatMessage(message)}`)
    .setColor(0xFAA61A); // Discord 黃色

  return interaction.reply({
    embeds: [embed],
    ephemeral,
  });
}

export async function sendError(interaction, message, ephemeral = true) {
  const embed = new EmbedBuilder()
    .setDescription(`❌ ${formatMessage(message)}`)
    .setColor(0xED4245); // Discord 紅色

  return interaction.reply({
    embeds: [embed],
    ephemeral,
  });
}