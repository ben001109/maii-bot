// Main entry point
import {startBot} from './bot/index.js';
import {logger} from './bot/utils/Logger.js';
import {config} from './config/index.js';

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
    logger.error('未捕獲的異常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('未處理的 Promise 拒絕:', reason);
});

// 啟動機器人
try {
    logger.info(`MAII-Bot 開始啟動...`);
    logger.info(`環境: ${config.NODE_ENV}`);
    startBot();
} catch (error) {
    logger.fatal('機器人啟動失敗:', error);
    process.exit(1);
}