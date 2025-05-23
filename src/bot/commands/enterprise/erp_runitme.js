

import { timerHandler } from '../../utils/handler/timerHandler.js';
import { handleEnterpriseEarnings } from '../../utils/handler/earningtimer.js';
// import { handlePassiveSystems } from '../../utils/handler/passives.js';
import { logger } from '../../utils/Logging.js';

export async function runGameRuntimeTick() {
  try {
    logger.debug('[ERP] 觸發遊戲主循環 tick');
    await timerHandler.handleGameTick();         // 包含推進遊戲時間與冷卻時間、Redis 同步
    await handleEnterpriseEarnings();            // 處理企業收入
    // await handlePassiveSystems();                // 處理其他自動邏輯（例如狀態恢復、研發等）
  } catch (err) {
    logger.error(`[ERP] 遊戲循環 tick 發生錯誤: ${err?.stack ?? err}`);
  }
}