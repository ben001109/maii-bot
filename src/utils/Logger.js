// src/utils/Logger.js

import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';
import {config} from '../config/config.js';

// === 1. 確保 logs 資料夾存在 ===
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir, {recursive: true});
    } catch (err) {
        console.error('[Logger] ❌ 無法建立 logs 資料夾:', err);
        process.exit(1); // 無法記錄就強制退出
    }
}

// === 2. 設定 Logger 記錄等級與格式 ===
const isProduction = config.environment === 'production';

/**
 * Central logger instance for consistent logging across the application
 */
export const logger = pino({
    level: config.logging.level || (isProduction ? 'info' : 'debug'),
    base: null, // 移除 pid, hostname
    transport: {
        targets: [
            {
                level: 'debug',
                target: 'pino-pretty',
                options: {
                    colorize: !isProduction,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname'
                }
            },
            {
                level: 'info',
                target: 'pino/file',
                options: {
                    destination: path.join(logDir, 'maiibot.log'),
                    mkdir: true
                }
            }
        ]
    },
    name: 'maii-bot',
});

/**
 * Create a named child logger for specific components
 * @param {string} name - Component name for the logger
 * @returns {import('pino').Logger} Child logger instance
 */
export function createLogger(name) {
    return logger.child({name});
}

export default logger;
