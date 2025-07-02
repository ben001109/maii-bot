import Config from './Config.js';
import Logger from './Logger.js';
import { StorageFactory } from '../storage/StorageFactory.js';
import { PlayerService } from '../services/PlayerService.js';
import { CurrencyService } from '../services/CurrencyService.js';
import I18nService from '../services/I18nService.js';
import { ErrorHandler } from './Errors.js';

/**
 * 主應用程序類 - 管理依賴注入和生命周期
 */
export class Application {
  constructor() {
    this.logger = Logger.createChildLogger('Application');
    this.services = new Map();
    this.isInitialized = false;
    this.isShuttingDown = false;
  }

  /**
   * 初始化應用程序
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('應用程序已初始化');
      return;
    }

    try {
      this.logger.info('開始初始化應用程序...');

      // 1. 驗證配置
      Config.validate();

      // 2. 初始化存儲層
      const storageFactory = new StorageFactory(Config);
      const { storageProvider, playerRepository, cacheProvider } = 
        await storageFactory.initializeAll();

      this.services.set('storageFactory', storageFactory);
      this.services.set('storageProvider', storageProvider);
      this.services.set('playerRepository', playerRepository);
      this.services.set('cacheProvider', cacheProvider);

      // 3. 初始化業務服務
      const playerService = new PlayerService(playerRepository, cacheProvider, Config);
      const currencyService = new CurrencyService(Config);

      this.services.set('playerService', playerService);
      this.services.set('currencyService', currencyService);
      this.services.set('i18nService', I18nService);
      this.services.set('config', Config);
      this.services.set('logger', Logger);

      // 4. 設置全局錯誤處理
      this.setupGlobalErrorHandling();

      // 5. 設置優雅關閉
      this.setupGracefulShutdown();

      this.isInitialized = true;
      this.logger.info('應用程序初始化完成');

    } catch (error) {
      this.logger.error('應用程序初始化失敗', { error: error.message });
      throw error;
    }
  }

  /**
   * 獲取服務實例
   * @param {string} serviceName 服務名稱
   * @returns {any} 服務實例
   */
  getService(serviceName) {
    if (!this.isInitialized) {
      throw new Error('應用程序尚未初始化');
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`服務 ${serviceName} 未找到`);
    }

    return service;
  }

  /**
   * 獲取所有服務
   * @returns {Object} 服務對象
   */
  getAllServices() {
    if (!this.isInitialized) {
      throw new Error('應用程序尚未初始化');
    }

    const servicesObj = {};
    for (const [name, service] of this.services.entries()) {
      servicesObj[name] = service;
    }
    return servicesObj;
  }

  /**
   * 檢查服務是否可用
   * @param {string} serviceName 服務名稱
   * @returns {boolean}
   */
  hasService(serviceName) {
    return this.services.has(serviceName);
  }

  /**
   * 關閉應用程序
   */
  async shutdown() {
    if (this.isShuttingDown) {
      this.logger.warn('應用程序正在關閉中...');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('開始關閉應用程序...');

    try {
      // 關閉存儲連接
      const storageFactory = this.services.get('storageFactory');
      if (storageFactory) {
        await storageFactory.shutdown();
      }

      // 清理服務
      this.services.clear();
      this.isInitialized = false;

      this.logger.info('應用程序已安全關閉');
    } catch (error) {
      this.logger.error('應用程序關閉時發生錯誤', { error: error.message });
      throw error;
    }
  }

  /**
   * 獲取應用程序狀態
   * @returns {Object} 狀態信息
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      shuttingDown: this.isShuttingDown,
      servicesCount: this.services.size,
      services: Array.from(this.services.keys())
    };
  }

  /**
   * 健康檢查
   * @returns {Promise<Object>} 健康狀態
   */
  async healthCheck() {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {}
    };

    if (!this.isInitialized) {
      status.status = 'unhealthy';
      status.error = '應用程序未初始化';
      return status;
    }

    try {
      // 檢查存儲連接
      const storageProvider = this.services.get('storageProvider');
      if (storageProvider) {
        status.services.storage = {
          connected: await storageProvider.isConnected()
        };
      }

      // 檢查國際化服務
      const i18nService = this.services.get('i18nService');
      if (i18nService) {
        status.services.i18n = i18nService.getStats();
      }

      // 總體狀態評估
      const unhealthyServices = Object.values(status.services)
        .filter(service => service.connected === false);
      
      if (unhealthyServices.length > 0) {
        status.status = 'degraded';
      }

    } catch (error) {
      status.status = 'unhealthy';
      status.error = error.message;
    }

    return status;
  }

  // 私有方法

  setupGlobalErrorHandling() {
    // 未捕獲的異常
    process.on('uncaughtException', (error) => {
      this.logger.error('未捕獲的異常', { 
        error: error.message, 
        stack: error.stack 
      });
      
      if (!ErrorHandler.isOperationalError(error)) {
        process.exit(1);
      }
    });

    // 未處理的 Promise 拒絕
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('未處理的 Promise 拒絕', { 
        reason: reason?.message || reason,
        stack: reason?.stack
      });
    });

    // 警告事件
    process.on('warning', (warning) => {
      this.logger.warn('Node.js 警告', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack
      });
    });
  }

  setupGracefulShutdown() {
    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.info(`收到 ${signal} 信號，開始優雅關閉`);
        try {
          await this.shutdown();
          process.exit(0);
        } catch (error) {
          this.logger.error('優雅關閉失敗', { error: error.message });
          process.exit(1);
        }
      });
    });
  }
}
