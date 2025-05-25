// src/db/initialize.js

import {prisma} from './prismaClient.js';
import {logger} from '../bot/utils/Logger.js';

/**
 * 初始化資料庫連接
 * @returns {Promise<void>}
 */
export async function initializeDatabaseConnection() {
    try {
        // 嘗試進行一個簡單查詢來測試連接
        await prisma.$queryRaw`SELECT 1`;
        logger.info('資料庫連接成功');
    } catch (error) {
        logger.error('資料庫連接失敗:', error);
        throw error;
    }
}

/**
 * 關閉資料庫連接
 * @returns {Promise<void>}
 */
export async function closeDatabaseConnection() {
    try {
        await prisma.$disconnect();
        logger.info('資料庫連接已關閉');
    } catch (error) {
        logger.error('關閉資料庫連接時出錯:', error);
        throw error;
    }
}

/**
 * 安全執行資料庫事務
 * @param {Function} callback - 事務回調函數
 * @returns {Promise<any>} 事務結果
 */
export async function withTransaction(callback) {
    try {
        return await prisma.$transaction(async (tx) => {
            return await callback(tx);
        });
    } catch (error) {
        logger.error('執行資料庫事務時出錯:', error);
        throw error;
    }
}
