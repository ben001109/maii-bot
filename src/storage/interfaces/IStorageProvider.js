/**
 * 存儲提供者抽象接口
 */
export class IStorageProvider {
  /**
   * 初始化連接
   */
  async connect() {
    throw new Error('connect() method must be implemented');
  }

  /**
   * 關閉連接
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented');
  }

  /**
   * 檢查連接狀態
   */
  async isConnected() {
    throw new Error('isConnected() method must be implemented');
  }
}

/**
 * 玩家數據存儲接口
 */
export class IPlayerRepository {
  /**
   * 獲取玩家數據
   * @param {string} playerId 
   * @returns {Promise<Object|null>}
   */
  async getPlayer(playerId) {
    throw new Error('getPlayer() method must be implemented');
  }

  /**
   * 創建玩家
   * @param {string} playerId 
   * @param {number} initialBalance 
   * @returns {Promise<boolean>}
   */
  async createPlayer(playerId, initialBalance = 0) {
    throw new Error('createPlayer() method must be implemented');
  }

  /**
   * 更新玩家餘額
   * @param {string} playerId 
   * @param {number} balance 
   * @returns {Promise<void>}
   */
  async updatePlayerBalance(playerId, balance) {
    throw new Error('updatePlayerBalance() method must be implemented');
  }

  /**
   * 刪除玩家
   * @param {string} playerId 
   * @returns {Promise<boolean>}
   */
  async deletePlayer(playerId) {
    throw new Error('deletePlayer() method must be implemented');
  }

  /**
   * 重置所有數據
   * @returns {Promise<void>}
   */
  async reset() {
    throw new Error('reset() method must be implemented');
  }

  /**
   * 檢查玩家是否存在
   * @param {string} playerId 
   * @returns {Promise<boolean>}
   */
  async playerExists(playerId) {
    throw new Error('playerExists() method must be implemented');
  }
}

/**
 * 緩存存儲接口
 */
export class ICacheProvider {
  /**
   * 獲取緩存值
   * @param {string} key 
   * @returns {Promise<any>}
   */
  async get(key) {
    throw new Error('get() method must be implemented');
  }

  /**
   * 設置緩存值
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl 過期時間（秒）
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = 3600) {
    throw new Error('set() method must be implemented');
  }

  /**
   * 刪除緩存
   * @param {string} key 
   * @returns {Promise<boolean>}
   */
  async del(key) {
    throw new Error('del() method must be implemented');
  }

  /**
   * 檢查鍵是否存在
   * @param {string} key 
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    throw new Error('exists() method must be implemented');
  }

  /**
   * 清空所有緩存
   * @returns {Promise<void>}
   */
  async flush() {
    throw new Error('flush() method must be implemented');
  }
}
