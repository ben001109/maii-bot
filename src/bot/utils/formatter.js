export const COOLDOWN_LABELS = {
  enterpriseCreate: "企業創建",
  researchStart: "研發啟動",
  expeditionSend: "探勘派遣"
};

/**
 * 將冷卻秒數格式化為遊戲與現實時間顯示
 * @param {number} secDiff 遊戲內剩餘秒數
 * @returns {string} 時間格式字串
 */
export function formatCooldownDuration(secDiff) {
  const hrs = Math.floor(secDiff / 3600);
  const min = Math.floor((secDiff % 3600) / 60);
  const sec = secDiff % 60;

  const realSec = Math.floor(secDiff / 6);
  const rHrs = Math.floor(realSec / 3600);
  const rMin = Math.floor((realSec % 3600) / 60);
  const rSec = realSec % 60;

  return `${hrs} 小時 ${min} 分 ${sec} 秒（現實約 ${rHrs} 小時 ${rMin} 分 ${rSec} 秒）`;
}