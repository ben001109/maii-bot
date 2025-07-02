import { 
  ValidationError, 
  NotFoundError, 
  InsufficientFundsError,
  ErrorHandler 
} from '../core/Errors.js';
import Logger from '../core/Logger.js';

/**
 * 玩家管理服務
 */
export class PlayerService {
  constructor(playerRepository, cacheProvider, config) {
    this.playerRepository = playerRepository;
    this.cacheProvider = cacheProvider;
    this.config = config;
    this.logger = Logger.createChildLogger('PlayerService');
  }

  /**
   * 獲取玩家餘額（帶緩存）
   * @param {string} playerId 
   * @returns {Promise<number>}
   */
  async getBalance(playerId) {
    this.validatePlayerId(playerId);
    
    try {
      // 先檢查緩存
      const cacheKey = `player:${playerId}:balance`;
      const cachedBalance = await this.cacheProvider.get(cacheKey);
      
      if (cachedBalance !== undefined) {
        this.logger.debug(`從緩存獲取玩家餘額`, { playerId, balance: cachedBalance });
        return cachedBalance;
      }

      // 從數據庫獲取
      const player = await this.playerRepository.getPlayer(playerId);
      const balance = player ? player.balance : 0;

      // 更新緩存
      await this.cacheProvider.set(cacheKey, balance, 300); // 5分鐘緩存
      
      this.logger.debug(`從數據庫獲取玩家餘額`, { playerId, balance });
      return balance;
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 創建新玩家
   * @param {string} playerId 
   * @param {number} initialBalance 
   * @returns {Promise<boolean>}
   */
  async createPlayer(playerId, initialBalance = null) {
    this.validatePlayerId(playerId);

    if (initialBalance === null) {
      initialBalance = this.config.get('game.startingBalance') || 1000;
    }

    if (initialBalance < 0) {
      throw new ValidationError('初始餘額不能為負數', 'initialBalance');
    }

    try {
      const created = await this.playerRepository.createPlayer(playerId, initialBalance);
      
      if (created) {
        // 更新緩存
        const cacheKey = `player:${playerId}:balance`;
        await this.cacheProvider.set(cacheKey, initialBalance, 300);
        
        this.logger.info(`玩家創建成功`, { playerId, initialBalance });
      } else {
        this.logger.info(`玩家已存在`, { playerId });
      }

      return created;
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 存款
   * @param {string} playerId 
   * @param {number} amount 
   * @returns {Promise<number>} 新餘額
   */
  async deposit(playerId, amount) {
    this.validatePlayerId(playerId);
    this.validateAmount(amount, false); // 不允許負數

    try {
      // 確保玩家存在
      await this.ensurePlayerExists(playerId);
      
      const currentBalance = await this.getBalance(playerId);
      const newBalance = currentBalance + amount;
      
      await this.updateBalance(playerId, newBalance);
      
      this.logger.info(`玩家存款成功`, { 
        playerId, 
        amount, 
        previousBalance: currentBalance,
        newBalance 
      });

      return newBalance;
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 提款
   * @param {string} playerId 
   * @param {number} amount 
   * @returns {Promise<number>} 新餘額
   */
  async withdraw(playerId, amount) {
    this.validatePlayerId(playerId);
    this.validateAmount(amount, false); // 不允許負數

    try {
      const currentBalance = await this.getBalance(playerId);
      
      if (amount > currentBalance) {
        throw new InsufficientFundsError(amount, currentBalance);
      }

      const newBalance = currentBalance - amount;
      await this.updateBalance(playerId, newBalance);
      
      this.logger.info(`玩家提款成功`, { 
        playerId, 
        amount, 
        previousBalance: currentBalance,
        newBalance 
      });

      return newBalance;
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 轉帳
   * @param {string} fromPlayerId 
   * @param {string} toPlayerId 
   * @param {number} amount 
   * @returns {Promise<{fromBalance: number, toBalance: number}>}
   */
  async transfer(fromPlayerId, toPlayerId, amount) {
    this.validatePlayerId(fromPlayerId);
    this.validatePlayerId(toPlayerId);
    this.validateAmount(amount, false);

    if (fromPlayerId === toPlayerId) {
      throw new ValidationError('不能向自己轉帳');
    }

    try {
      // 確保雙方玩家都存在
      await this.ensurePlayerExists(fromPlayerId);
      await this.ensurePlayerExists(toPlayerId);

      const fromBalance = await this.withdraw(fromPlayerId, amount);
      const toBalance = await this.deposit(toPlayerId, amount);

      this.logger.info(`轉帳成功`, {
        fromPlayerId,
        toPlayerId,
        amount,
        fromBalance,
        toBalance
      });

      return { fromBalance, toBalance };
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 檢查玩家是否存在
   * @param {string} playerId 
   * @returns {Promise<boolean>}
   */
  async playerExists(playerId) {
    this.validatePlayerId(playerId);
    
    try {
      return await this.playerRepository.playerExists(playerId);
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 刪除玩家
   * @param {string} playerId 
   * @returns {Promise<boolean>}
   */
  async deletePlayer(playerId) {
    this.validatePlayerId(playerId);

    try {
      const deleted = await this.playerRepository.deletePlayer(playerId);
      
      if (deleted) {
        // 清除緩存
        const cacheKey = `player:${playerId}:balance`;
        await this.cacheProvider.del(cacheKey);
        
        this.logger.info(`玩家刪除成功`, { playerId });
      }

      return deleted;
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  /**
   * 重置所有玩家數據
   * @returns {Promise<void>}
   */
  async resetAllPlayers() {
    try {
      await this.playerRepository.reset();
      await this.cacheProvider.flush();
      
      this.logger.info('所有玩家數據已重置');
    } catch (error) {
      ErrorHandler.handle(error, this.logger);
      throw error;
    }
  }

  // 私有方法

  validatePlayerId(playerId) {
    if (!playerId || typeof playerId !== 'string' || playerId.trim() === '') {
      throw new ValidationError('玩家ID無效', 'playerId');
    }
  }

  validateAmount(amount, allowNegative = true) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('金額必須是有效數字', 'amount');
    }

    if (!allowNegative && amount <= 0) {
      throw new ValidationError('金額必須大於0', 'amount');
    }

    if (allowNegative && amount < 0) {
      throw new ValidationError('金額不能為負數', 'amount');
    }
  }

  async ensurePlayerExists(playerId) {
    const exists = await this.playerExists(playerId);
    if (!exists) {
      throw new NotFoundError(`玩家 ${playerId}`);
    }
  }

  async updateBalance(playerId, newBalance) {
    await this.playerRepository.updatePlayerBalance(playerId, newBalance);
    
    // 更新緩存
    const cacheKey = `player:${playerId}:balance`;
    await this.cacheProvider.set(cacheKey, newBalance, 300);
  }
}
