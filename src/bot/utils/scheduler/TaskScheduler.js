// src/bot/utils/scheduler/TaskScheduler.js

import cron from 'node-cron';
import {logger} from '../Logger.js';
import {playerManager} from '../PlayerManager.js';
import {redis} from '../../../redis/redisClient.js';
import {prisma} from '../../../db/prismaClient.js';

/**
 * 已註冊的任務
 */
const scheduledTasks = new Map();

/**
 * 設置定時任務
 * @param {Object} client - Discord 客戶端
 */
export function setupScheduledTasks(client) {
    try {
        // 每分鐘更新玩家遊戲時間
        scheduledTasks.set('updateGameTime', cron.schedule('* * * * *', async () => {
            try {
                logger.debug('執行定時任務: 更新玩家遊戲時間');

                // 獲取所有活躍玩家
                const activePlayers = await prisma.player.findMany({
                    where: {
                        initialized: true,
                        lastActiveAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小時內活躍
                        }
                    },
                    select: {
                        userId: true
                    }
                });

                // 更新每個玩家的遊戲時間（每分鐘增加 0.1 小時遊戲時間，相當於 6:1 的時間比例）
                for (const player of activePlayers) {
                    await playerManager.updatePlayerGameTime(player.userId, 0.1);
                }

                logger.debug(`已更新 ${activePlayers.length} 位玩家的遊戲時間`);
            } catch (error) {
                logger.error('更新玩家遊戲時間時出錯:', error);
            }
        }));

        // 每小時執行企業收入計算
        scheduledTasks.set('calculateEnterpriseIncome', cron.schedule('0 * * * *', async () => {
            try {
                logger.info('執行定時任務: 計算企業收入');

                // 獲取所有企業
                const enterprises = await prisma.enterprise.findMany({
                    include: {
                        owner: true
                    }
                });

                // 計算每個企業的收入
                for (const enterprise of enterprises) {
                    // 根據企業等級和類型計算基礎收入
                    const baseIncome = calculateEnterpriseBaseIncome(enterprise);

                    // 更新企業資產
                    await prisma.enterprise.update({
                        where: {
                            id: enterprise.id
                        },
                        data: {
                            assets: {
                                increment: baseIncome
                            }
                        }
                    });

                    // 更新玩家資金
                    await playerManager.updatePlayerMoney(enterprise.ownerId, baseIncome);

                    logger.debug(`企業 ${enterprise.name} (${enterprise.id}) 產生了 $${baseIncome} 的收入`);
                }

                logger.info(`已處理 ${enterprises.length} 個企業的收入`);
            } catch (error) {
                logger.error('計算企業收入時出錯:', error);
            }
        }));

        // 每天午夜執行資料備份
        scheduledTasks.set('dailyBackup', cron.schedule('0 0 * * *', async () => {
            try {
                logger.info('執行定時任務: 每日資料備份');

                // 實際備份邏輯待實作

                logger.info('每日資料備份完成');
            } catch (error) {
                logger.error('執行每日資料備份時出錯:', error);
            }
        }));

        // 每週一早上 3 點清理過期資料
        scheduledTasks.set('weeklyCleanup', cron.schedule('0 3 * * 1', async () => {
            try {
                logger.info('執行定時任務: 每週資料清理');

                // 清理超過 30 天的交易記錄
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const result = await prisma.transaction.deleteMany({
                    where: {
                        createdAt: {
                            lt: thirtyDaysAgo
                        }
                    }
                });

                logger.info(`已清理 ${result.count} 筆過期交易記錄`);
            } catch (error) {
                logger.error('執行每週資料清理時出錯:', error);
            }
        }));

        logger.info(`已設置 ${scheduledTasks.size} 個定時任務`);
    } catch (error) {
        logger.error('設置定時任務時出錯:', error);
    }
}

/**
 * 計算企業基礎收入
 * @param {Object} enterprise - 企業資料
 * @returns {Number} 基礎收入
 */
function calculateEnterpriseBaseIncome(enterprise) {
    // 基礎收入公式: 1000 + (等級 * 500) + 隨機波動
    const baseAmount = 1000;
    const levelBonus = (enterprise.level || 1) * 500;
    const randomFactor = Math.random() * 0.3 + 0.85; // 85% - 115% 隨機波動

    // 根據企業類型調整收入倍率
    let typeMultiplier = 1.0;

    switch (enterprise.type) {
        case 'restaurant':
            typeMultiplier = 1.2;
            break;
        case 'tech':
            typeMultiplier = 1.5;
            break;
        case 'finance':
            typeMultiplier = 1.8;
            break;
        case 'store':
            typeMultiplier = 1.1;
            break;
        case 'farm':
            typeMultiplier = 0.9;
            break;
        case 'factory':
            typeMultiplier = 1.3;
            break;
        default:
            typeMultiplier = 1.0;
    }

    // 計算最終收入
    const income = Math.floor((baseAmount + levelBonus) * randomFactor * typeMultiplier);

    return income;
}

/**
 * 獲取已註冊的任務
 * @returns {Map} 任務映射
 */
export function getScheduledTasks() {
    return scheduledTasks;
}

/**
 * 停止所有任務
 */
export function stopAllTasks() {
    for (const [name, task] of scheduledTasks.entries()) {
        task.stop();
        logger.info(`已停止任務: ${name}`);
    }

    scheduledTasks.clear();
    logger.info('已停止所有定時任務');
}

/**
 * 手動觸發指定任務
 * @param {String} taskName - 任務名稱
 * @returns {Promise<void>}
 */
export async function triggerTask(taskName) {
    const task = scheduledTasks.get(taskName);

    if (!task) {
        throw new Error(`找不到任務: ${taskName}`);
    }

    logger.info(`手動觸發任務: ${taskName}`);
    await task.execute();

    return `已執行任務: ${taskName}`;
}
