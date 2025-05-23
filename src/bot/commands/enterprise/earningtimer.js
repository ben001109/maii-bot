
import { getAllPlayers, updatePlayer } from '../../../services/playerService.js';
import { logger } from '../../utils/Logging.js';

/**
 * 處理所有玩家企業收入計算（每 tick 呼叫一次）
 * 每家企業根據 income 欄位，每秒給付收入（income / 3600）
 */
export async function handleEnterpriseEarnings() {
  const players = await getAllPlayers();

  for (const player of players) {
    if (!Array.isArray(player.enterprises) || player.enterprises.length === 0) continue;

    let totalEarnings = 0;

    for (const ent of player.enterprises) {
      const hourlyIncome = ent.income ?? 0;
      totalEarnings += hourlyIncome / 3600; // 每秒收入
    }

    if (totalEarnings > 0) {
      player.money = (player.money ?? 0) + totalEarnings;
      await updatePlayer(player.discordId, player);
      logger.debug(`[EARNING] ${player.discordId} 收入 $${totalEarnings.toFixed(2)}`);
    }
  }
}
