/**
 * 根據玩家隱私自動決定 ephemeral 狀態，並產生 Discord reply/followUp options。
 * @param {*} player 玩家資料
 * @param {*} contentOrOptions 字串訊息或完整 options
 * @returns {object} Discord MessageOptions，已設好 ephemeral 屬性
 */
export function getEphemeralForPlayer(player, contentOrOptions) {
  const isEphemeral = (player?.privacy?.replyVisibility ?? 'private') !== 'public';
  const options = typeof contentOrOptions === 'string'
    ? { content: contentOrOptions }
    : { ...contentOrOptions };
  options.ephemeral = isEphemeral;
  return options;
}