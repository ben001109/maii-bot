import { redis } from '../../../../lib/redis.js';
import { getAllPlayers, updatePlayer } from '../../../services/playerService.js';

export const timerHandler = {
  /**
   * 每秒呼叫一次，處理遊戲時間推進
   */
  async handleGameTick() {
    console.log("[Timer] 處理所有玩家遊戲時間推進");

    const allPlayers = await getAllPlayers();
    for (const player of allPlayers) {
      if (!player.time) continue;
      const current = new Date(player.time);
      current.setSeconds(current.getSeconds() + 1); // 每人時間推進
      player.time = current.toISOString();
      await updatePlayer(player.discordId, player);
    }
    // 記錄伺服器全域遊戲時間至 Redis
    await redis.set('system:time', new Date().toISOString());
  }
};

/**
 * 將遊戲時間秒數轉換為 hh:mm:ss 字串（每秒 +1，等於遊戲世界 6 秒）
 */
function formatGameTime(seconds) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const min = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${min}:${sec}`;
}

let intervalId = null;

/**
 * 啟動遊戲計時器（每 6 秒推進一次）
 */
export function startTimer() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    timerHandler.handleGameTick();
  }, 6000); // 遊戲內 6 秒等於現實 1 秒
}
