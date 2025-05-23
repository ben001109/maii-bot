import { getPlayer, setPlayer, getAllPlayers } from '../../../services/playerService.js';

export const EconHandler = {
  /**
   * 取得玩家當前資產餘額
   * @param {string} discordId
   * @returns {Promise<number>}
   */
  async getBalance(discordId) {
    try {
      const player = await getPlayer(discordId);
      return player?.money ?? 0;
    } catch (err) {
      return 0;
    }
  },

  /**
   * 取得資產排行榜
   * @param {number} limit
   * @returns {Promise<Array<{ discordId: string, money: number }>>}
   */
  async getTopPlayers(limit = 10) {
    try {
      const players = await getAllPlayers();
      if (!Array.isArray(players)) return [];
      return players
        .sort((a, b) => (b.money ?? 0) - (a.money ?? 0))
        .slice(0, limit)
        .map(player => ({
          discordId: player.discordId,
          money: player.money ?? 0
        }));
    } catch (err) {
      return [];
    }
  },

  /**
   * 設定玩家經濟狀態
   * @param {string} discordId
   * @param {number} amount
   * @returns {Promise<void>}
   */
  async setBalance(discordId, amount) {
    try {
      const player = await getPlayer(discordId);
      if (player) {
        player.money = amount;
        await setPlayer(player);
      }
    } catch (err) {
      // do nothing, fallback
    }
  },

  async modifyMoney(discordId, amount) {
    try {
      const player = await getPlayer(discordId);
      if (!player) {
        return { success: false, message: '找不到對應玩家' };
      }
      player.money = (player.money ?? 0) + amount;
      await setPlayer(player);
      return { success: true };
    } catch (err) {
      return { success: false, message: '資產調整失敗' };
    }
  },

  /**
   * 進行玩家間資產轉帳
   * @param {string} fromId 發送者 Discord ID
   * @param {string} toId 接收者 Discord ID
   * @param {number} amount 金額
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async transferMoney(fromId, toId, amount) {
    try {
      if (amount <= 0 || fromId === toId) {
        return { success: false, message: '無效的轉帳參數' };
      }

      const [fromPlayer, toPlayer] = await Promise.all([
        getPlayer(fromId),
        getPlayer(toId)
      ]);

      if (!fromPlayer || !toPlayer) {
        return { success: false, message: '找不到對應玩家' };
      }

      if ((fromPlayer.money ?? 0) < amount) {
        return { success: false, message: '餘額不足' };
      }

      fromPlayer.money -= amount;
      toPlayer.money += amount;

      await Promise.all([
        setPlayer(fromPlayer),
        setPlayer(toPlayer)
      ]);

      return { success: true };
    } catch (err) {
      return { success: false, message: '轉帳失敗' };
    }
  }
};
