// Main entry point
import {startBot} from './bot/index.js';
import {logger} from './utils/Logger.js';
import {config} from './config/config.js';

// 啟動機器人
try {
    logger.info(`MAII-Bot 開始啟動...`);
    logger.info(`環境: ${config.environment}`);
    startBot();
} catch (error) {
    logger.fatal('機器人啟動失敗:', error);
    process.exit(1);
}
