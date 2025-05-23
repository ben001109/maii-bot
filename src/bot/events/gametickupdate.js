import { timerHandler } from '../utils/handler/timerHandler.js';
import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    setInterval(async () => {
      try {
        await timerHandler.handleGameTick(); // 遊戲時間邏輯處理
      } catch (err) {
        console.error('[GameTick] 執行失敗:', err);
      }
    }, 6000); // 每 6 秒現實時間推進 1 秒遊戲時間
  }
};
