import { Application } from './core/Application.js';
import Logger from './core/Logger.js';

// 全局應用實例
let app = null;

/**
 * 主函數 - 啟動應用程序
 */
async function main() {
  const logger = Logger.createChildLogger('Main');
  
  try {
    logger.info('啟動 Maii Bot 應用程序...');

    // 創建並初始化應用
    app = new Application();
    await app.initialize();

    // 根據命令行參數決定啟動模式
    const args = process.argv.slice(2);
    const mode = args[0] || 'both';

    switch (mode) {
      case 'api':
        await startAPIServer();
        break;
      case 'bot':
        await startDiscordBot();
        break;
      case 'both':
      default:
        await Promise.all([
          startAPIServer(),
          startDiscordBot()
        ]);
        break;
    }

    logger.info('應用程序啟動完成');

  } catch (error) {
    logger.error('應用程序啟動失敗', { error: error.message });
    process.exit(1);
  }
}

/**
 * 啟動 API 服務器
 */
async function startAPIServer() {
  const logger = Logger.createChildLogger('APIServer');
  
  try {
    // 動態導入 API 模塊
    const { createAPIServer } = await import('./api/server.js');
    const apiServer = createAPIServer(app.getAllServices());
    
    const config = app.getService('config');
    const port = config.get('apiPort');
    
    apiServer.listen(port, () => {
      logger.info(`API 服務器運行在端口 ${port}`);
    });

  } catch (error) {
    logger.error('API 服務器啟動失敗', { error: error.message });
    throw error;
  }
}

/**
 * 啟動 Discord Bot
 */
async function startDiscordBot() {
  const logger = Logger.createChildLogger('DiscordBot');
  
  try {
    // 動態導入 Bot 模塊
    const { createDiscordBot } = await import('./bot/client.js');
    const discordBot = await createDiscordBot(app.getAllServices());
    
    const config = app.getService('config');
    const token = config.get('discordToken');
    
    if (!token) {
      throw new Error('Discord token 未配置');
    }

    await discordBot.login(token);
    logger.info('Discord Bot 已登入');

  } catch (error) {
    logger.error('Discord Bot 啟動失敗', { error: error.message });
    throw error;
  }
}

/**
 * 測試模式入口
 */
export async function createTestApplication() {
  if (!app) {
    app = new Application();
    await app.initialize();
  }
  return app;
}

/**
 * 獲取應用實例（用於測試）
 */
export function getApplication() {
  return app;
}

/**
 * 匯出業務函數（向後兼容）
 */
export async function add(a, b) {
  if (!app || !app.getService) {
    // 如果應用未初始化，先初始化
    await createTestApplication();
  }
  
  const logger = app.getService('logger');
  const result = a + b;
  
  logger.info(`執行加法運算: ${a} + ${b} = ${result}`);
  return result;
}

/**
 * 執行命令（向後兼容）
 */
export async function runCommand(name, ...args) {
  if (!app || !app.getService) {
    await createTestApplication();
  }

  // 動態導入命令處理器
  const { CommandRegistry } = await import('./bot/CommandRegistry.js');
  const commandRegistry = new CommandRegistry(app.getAllServices());
  
  return commandRegistry.executeCommand(name, ...args);
}

// 如果直接運行此文件，則啟動應用
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
