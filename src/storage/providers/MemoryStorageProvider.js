import { IStorageProvider, IPlayerRepository, ICacheProvider } from '../interfaces/IStorageProvider.js';
import { DatabaseError } from '../../core/Errors.js';
import Logger from '../../core/Logger.js';

/**
 * 內存存儲提供者
 */
export class MemoryStorageProvider extends IStorageProvider {
  constructor() {
    super();
    this.logger = Logger.createChildLogger('MemoryStorage');
    this.connected = false;
  }

  async connect() {
    this.connected = true;
    this.logger.info('內存存儲已連接');
    return true;
  }

  async disconnect() {
    this.connected = false;
    this.logger.info('內存存儲已斷開連接');
    return true;
  }

  async isConnected() {
    return this.connected;
  }
}

/**
 * 內存玩家數據倉庫
 */
export class MemoryPlayerRepository extends IPlayerRepository {
  constructor() {
    super();
    this.players = new Map();
    this.logger = Logger.createChildLogger('MemoryPlayerRepo');
  }

  async getPlayer(playerId) {
    try {
      const player = this.players.get(playerId);
      return player ? { ...player } : null;
    } catch (error) {
      throw new DatabaseError('獲取玩家數據失敗', error);
    }
  }

  async createPlayer(playerId, initialBalance = 0) {
    try {
      if (this.players.has(playerId)) {
        return false;
      }

      const player = {
        id: playerId,
        balance: initialBalance,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.players.set(playerId, player);
      this.logger.info(`玩家 ${playerId} 創建成功`, { initialBalance });
      return true;
    } catch (error) {
      throw new DatabaseError('創建玩家失敗', error);
    }
  }

  async updatePlayerBalance(playerId, balance) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        throw new DatabaseError(`玩家 ${playerId} 不存在`);
      }

      player.balance = balance;
      player.updatedAt = new Date();
      this.players.set(playerId, player);

      this.logger.debug(`玩家 ${playerId} 餘額更新為 ${balance}`);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('更新玩家餘額失敗', error);
    }
  }

  async deletePlayer(playerId) {
    try {
      const deleted = this.players.delete(playerId);
      if (deleted) {
        this.logger.info(`玩家 ${playerId} 已刪除`);
      }
      return deleted;
    } catch (error) {
      throw new DatabaseError('刪除玩家失敗', error);
    }
  }

  async reset() {
    try {
      const count = this.players.size;
      this.players.clear();
      this.logger.info(`已重置 ${count} 個玩家數據`);
    } catch (error) {
      throw new DatabaseError('重置數據失敗', error);
    }
  }

  async playerExists(playerId) {
    try {
      return this.players.has(playerId);
    } catch (error) {
      throw new DatabaseError('檢查玩家是否存在失敗', error);
    }
  }
}

/**
 * 內存緩存提供者
 */
export class MemoryCacheProvider extends ICacheProvider {
  constructor() {
    super();
    this.cache = new Map();
    this.timers = new Map();
    this.logger = Logger.createChildLogger('MemoryCache');
  }

  async get(key) {
    try {
      const data = this.cache.get(key);
      if (data && data.expiresAt && Date.now() > data.expiresAt) {
        await this.del(key);
        return undefined;
      }
      return data ? data.value : undefined;
    } catch (error) {
      this.logger.error('獲取緩存失敗', { key, error: error.message });
      return undefined;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      // 清除現有的定時器
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
      }

      const expiresAt = ttl > 0 ? Date.now() + (ttl * 1000) : null;
      this.cache.set(key, { value, expiresAt });

      // 設置過期定時器
      if (ttl > 0) {
        const timeoutId = setTimeout(() => {
          this.del(key);
        }, ttl * 1000);
        this.timers.set(key, timeoutId);
      }

      this.logger.debug(`緩存已設置`, { key, ttl });
    } catch (error) {
      this.logger.error('設置緩存失敗', { key, error: error.message });
    }
  }

  async del(key) {
    try {
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
      
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.logger.debug(`緩存已刪除`, { key });
      }
      return deleted;
    } catch (error) {
      this.logger.error('刪除緩存失敗', { key, error: error.message });
      return false;
    }
  }

  async exists(key) {
    try {
      const data = this.cache.get(key);
      if (data && data.expiresAt && Date.now() > data.expiresAt) {
        await this.del(key);
        return false;
      }
      return this.cache.has(key);
    } catch (error) {
      this.logger.error('檢查緩存是否存在失敗', { key, error: error.message });
      return false;
    }
  }

  async flush() {
    try {
      // 清除所有定時器
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      
      const count = this.cache.size;
      this.cache.clear();
      this.timers.clear();
      
      this.logger.info(`已清空 ${count} 個緩存項目`);
    } catch (error) {
      this.logger.error('清空緩存失敗', { error: error.message });
    }
  }
}
