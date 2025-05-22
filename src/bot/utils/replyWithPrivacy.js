import { MessageFlags } from 'discord.js';

/**
 * 根據玩家隱私自動決定 flags 狀態，並產生 Discord reply/followUp options。
 * @param {*} player 玩家資料
 * @param {*} contentOrOptions 字串訊息或完整 options
 * @returns {object} Discord MessageOptions，已設好 flags 屬性
 */
export function getEphemeralForPlayer(player, contentOrOptions) {
  // 判斷是否要隱私（private = 只自己看）
  const isEphemeral = (player?.privacy?.replyVisibility ?? 'private') !== 'public';
  const options = typeof contentOrOptions === 'string'
    ? { content: contentOrOptions }
    : { ...contentOrOptions };
  // ⚠️ 用 flags 取代 ephemeral
  if (isEphemeral) {
    options.flags = MessageFlags.Ephemeral;
  } else {
    // 保險起見，移除 flags
    if ('flags' in options) options.flags = undefined;
  }
  return options;
}