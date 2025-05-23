import { getEphemeralForPlayer } from './replyWithPrivacy.js';

// i18n 支援: 格式化訊息內容，可對接 i18n 套件
export function formatMessage(message) {
  // 若是字串則直接傳回；若是 key 則可替換成 i18n 函式如 i18n.t(key)
  // 目前暫為簡易實作，保留擴充點
  return typeof message === 'string' ? message : String(message);
}

import { EmbedBuilder } from 'discord.js';
// 這裡的 EmbedBuilder 是從 discord.js 套件中引入的
// EmbedBuilder 是用來建立 Discord 的嵌入式訊息
// 這裡的 EmbedBuilder 是用來建立 Discord 的嵌入式訊息
export async function sendSuccess(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`✅ ${formatMessage(message)}`)
    .setColor(0x57F287); // Discord 綠色

  return interaction.reply({
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer),
  });
}

export async function defer(interaction, ephemeral = true) {
  if (interaction.deferred || interaction.replied) return;
  return interaction.deferReply({ ephemeral });
}
export async function sendWarning(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`⚠️ ${formatMessage(message)}`)
    .setColor(0xFAA61A); // Discord 黃色

  return interaction.reply({
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer),
  });
}

export async function sendError(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`❌ ${formatMessage(message)}`)
    .setColor(0xED4245); // Discord 紅色

  return interaction.reply({
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer),
  });
}

export const replySuccess = sendSuccess;
export const replyFail = sendError;

// 管理員專用訊息，強制 ephemeral: true
export async function sendAdminMessage(interaction, message) {
  const embed = new EmbedBuilder()
    .setDescription(`🛠️ ${formatMessage(message)}`)
    .setColor(0x3498DB); // 藍色
  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

export async function sendSyncResult(interaction, summaryLines) {
  return interaction.editReply({
    content: summaryLines.join('\n')
  });
}
// 回覆工具：reset 結果通用訊息
export async function sendResetResult(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`♻️ ${formatMessage(message)}`)
    .setColor(0x7289DA); // Discord blurple

  const response = {
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer)
  };

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(response);
  }
    return interaction.reply(response);
}