import fs from 'fs';
import path from 'path';
import Logger from './Logger.js';

/**
 * 統一的配置管理器
 */
class Config {
  constructor() {
    this.logger = Logger.createChildLogger('Config');
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      apiPort: 3000,
      discordToken: process.env.DISCORD_TOKEN,
      database: {
        type: process.env.DB_TYPE || 'memory', // memory, postgres, sqlite
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'maii_bot'
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || ''
      },
      game: {
        currency: {
          code: 'TWD',
          name: 'New Taiwan Dollar',
          symbol: 'NT$',
          decimals: 0
        },
        startingBalance: 1000
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info'
      }
    };

    // 嘗試加載配置文件
    const configPath = path.resolve('./config.json');
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.logger.info('配置文件加載成功');
        return this.mergeConfig(defaultConfig, fileConfig);
      } catch (error) {
        this.logger.error('配置文件解析失敗，使用默認配置', { error: error.message });
        return defaultConfig;
      }
    }

    this.logger.info('使用默認配置');
    return defaultConfig;
  }

  mergeConfig(defaultConfig, fileConfig) {
    return {
      ...defaultConfig,
      ...fileConfig,
      database: { ...defaultConfig.database, ...fileConfig.database },
      redis: { ...defaultConfig.redis, ...fileConfig.redis },
      game: { ...defaultConfig.game, ...fileConfig.game },
      logging: { ...defaultConfig.logging, ...fileConfig.logging }
    };
  }

  get(key) {
    return key.split('.').reduce((obj, k) => obj && obj[k], this.config);
  }

  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => {
      if (!obj[k]) obj[k] = {};
      return obj[k];
    }, this.config);
    target[lastKey] = value;
  }

  // 驗證必要的配置
  validate() {
    const errors = [];

    if (!this.config.discordToken) {
      errors.push('Discord token 未設置');
    }

    if (this.config.apiPort < 1 || this.config.apiPort > 65535) {
      errors.push('API 端口無效');
    }

    if (errors.length > 0) {
      this.logger.error('配置驗證失敗', { errors });
      throw new Error(`配置錯誤: ${errors.join(', ')}`);
    }

    this.logger.info('配置驗證通過');
    return true;
  }
}

export default new Config();
