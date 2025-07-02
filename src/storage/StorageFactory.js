import { 
  MemoryStorageProvider, 
  MemoryPlayerRepository, 
  MemoryCacheProvider 
} from './providers/MemoryStorageProvider.js';
import { ConfigurationError } from '../core/Errors.js';
import Logger from '../core/Logger.js';

/**
 * 存儲工廠 - 創建和管理存儲實例
 */
export class StorageFactory {
  constructor(config) {
    this.config = config;
    this.logger = Logger.createChildLogger('StorageFactory');
    this.providers = new Map();
    this.repositories = new Map();
    this.cacheProviders = new Map();
  }

  /**
   * 創建存儲提供者
   * @param {string} type 存儲類型 
   * @returns {IStorageProvider}
   */
  createStorageProvider(type = 'memory') {
    if (this.providers.has(type)) {
      return this.providers.get(type);
    }

    let provider;
    switch (type.toLowerCase()) {
      case 'memory':
        provider = new MemoryStorageProvider();
        break;
      case 'postgres':
        // TODO: 實現 PostgreSQL 提供者
        throw new ConfigurationError('PostgreSQL 提供者尚未實現');
      case 'sqlite':
        // TODO: 實現 SQLite 提供者
        throw new ConfigurationError('SQLite 提供者尚未實現');
      default:
        throw new ConfigurationError(`不支持的存儲類型: ${type}`);
    }

    this.providers.set(type, provider);
    this.logger.info(`存儲提供者已創建`, { type });
    return provider;
  }

  /**
   * 創建玩家數據倉庫
   * @param {string} type 存儲類型
   * @returns {IPlayerRepository}
   */
  createPlayerRepository(type = 'memory') {
    if (this.repositories.has(type)) {
      return this.repositories.get(type);
    }

    let repository;
    switch (type.toLowerCase()) {
      case 'memory':
        repository = new MemoryPlayerRepository();
        break;
      case 'postgres':
        // TODO: 實現 PostgreSQL 玩家倉庫
        throw new ConfigurationError('PostgreSQL 玩家倉庫尚未實現');
      case 'sqlite':
        // TODO: 實現 SQLite 玩家倉庫
        throw new ConfigurationError('SQLite 玩家倉庫尚未實現');
      default:
        throw new ConfigurationError(`不支持的存儲類型: ${type}`);
    }

    this.repositories.set(type, repository);
    this.logger.info(`玩家數據倉庫已創建`, { type });
    return repository;
  }

  /**
   * 創建緩存提供者
   * @param {string} type 緩存類型
   * @returns {ICacheProvider}
   */
  createCacheProvider(type = 'memory') {
    if (this.cacheProviders.has(type)) {
      return this.cacheProviders.get(type);
    }

    let provider;
    switch (type.toLowerCase()) {
      case 'memory':
        provider = new MemoryCacheProvider();
        break;
      case 'redis':
        // TODO: 實現 Redis 提供者
        throw new ConfigurationError('Redis 提供者尚未實現');
      default:
        throw new ConfigurationError(`不支持的緩存類型: ${type}`);
    }

    this.cacheProviders.set(type, provider);
    this.logger.info(`緩存提供者已創建`, { type });
    return provider;
  }

  /**
   * 初始化所有存儲連接
   */
  async initializeAll() {
    const storageType = this.config.get('database.type');
    const cacheType = this.config.get('redis') ? 'redis' : 'memory';

    try {
      // 創建並連接存儲提供者
      const storageProvider = this.createStorageProvider(storageType);
      await storageProvider.connect();

      // 創建玩家數據倉庫
      this.createPlayerRepository(storageType);

      // 創建緩存提供者
      this.createCacheProvider(cacheType);

      this.logger.info('所有存儲組件初始化完成', { 
        storageType, 
        cacheType 
      });

      return {
        storageProvider,
        playerRepository: this.repositories.get(storageType),
        cacheProvider: this.cacheProviders.get(cacheType)
      };
    } catch (error) {
      this.logger.error('存儲組件初始化失敗', { error: error.message });
      throw error;
    }
  }

  /**
   * 關閉所有連接
   */
  async shutdown() {
    try {
      for (const provider of this.providers.values()) {
        if (provider.isConnected && await provider.isConnected()) {
          await provider.disconnect();
        }
      }

      // 清理緩存
      for (const cache of this.cacheProviders.values()) {
        if (cache.flush) {
          await cache.flush();
        }
      }

      this.providers.clear();
      this.repositories.clear();
      this.cacheProviders.clear();

      this.logger.info('所有存儲連接已關閉');
    } catch (error) {
      this.logger.error('關閉存儲連接時發生錯誤', { error: error.message });
      throw error;
    }
  }
}
