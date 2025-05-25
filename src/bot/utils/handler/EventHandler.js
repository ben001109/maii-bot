// src/bot/utils/handler/EventHandler.js

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {logger} from '../Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 載入事件處理器
 * @param {Object} client - Discord 客戶端
 */
export function loadEventHandlers(client) {
    try {
        const eventsPath = path.join(__dirname, '../../events');

        // 檢查事件目錄是否存在
        if (!fs.existsSync(eventsPath)) {
            logger.warn(`事件目錄不存在: ${eventsPath}`);
            return;
        }

        // 讀取事件檔案
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        // 載入每個事件
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            import(`file://${filePath}`)
                .then(({default: event}) => {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args));
                    }
                    logger.info(`已載入事件: ${event.name}`);
                })
                .catch(error => {
                    logger.error(`載入事件時出錯: ${file}`, error);
                });
        }

        logger.info(`總共載入 ${eventFiles.length} 個事件`);
    } catch (error) {
        logger.error('載入事件處理器時出錯:', error);
    }
}
