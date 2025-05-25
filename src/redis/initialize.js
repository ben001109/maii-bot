// src/redis/initialize.js

import {redis} from './redisClient.js';
import {logger} from '../bot/utils/Logger.js';

/**
 * 初始化 Redis 連接
 * @returns {Promise<void>}
 */
export async function initializeRedisConnection() {
    try {
        // 確保 Redis 連接已就緒
        if (redis.status !== 'ready') {
            await new Promise((resolve, reject) => {
                redis.once('ready', resolve);
                redis.once('error', reject);

                // 設置超時
                const timeout = setTimeout(() => {
                    reject(new Error('Redis 連接超時'));
                }, 5000);

                // 清除超時
                redis.once('ready', () => {
                    clearTimeout(timeout);
                });
            });
        }

        // 執行 PING 命令測試連接
        const pong = await redis.ping();
        if (pong === 'PONG') {
            logger.info('Redis 連接成功');
        } else {
            throw new Error('Redis 連接測試失敗');
        }
    } catch (error) {
        logger.error('Redis 連接失敗:', error);
        throw error;
    }
}

/**
 * 關閉 Redis 連接
 * @returns {Promise<void>}
 */
export async function closeRedisConnection() {
    try {
        await redis.quit();
        logger.info('Redis 連接已關閉');
    } catch (error) {
        logger.error('關閉 Redis 連接時出錯:', error);
        throw error;
    }
}

/**
 * 設置 Redis 健康檢查
 * @param {Number} interval - 檢查間隔（毫秒）
 * @returns {NodeJS.Timeout} 定時器
 */
export function setupRedisHealthCheck(interval = 60000) {
    return setInterval(async () => {
        try {
            const pong = await redis.ping();
            if (pong !== 'PONG') {
                logger.warn('Redis 健康檢查未收到 PONG 回應');
            }
        } catch (error) {
            logger.error('Redis 健康檢查失敗:', error);
        }
    }, interval);
}
