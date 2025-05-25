// src/bot/utils/PlayerManager.js

import {prisma} from '../../db/prismaClient.js';
import {redis} from '../../redis/redisClient.js';
import {logger} from './Logger.js';

/**
 * 玩家管理工具類
 */
class PlayerManager {
    /**
     * 初始化玩家
     * @param {String} userId - Discord 用戶 ID
     * @param {String} username - Discord 用戶名
     * @param {Object} options - 初始化選項
     * @returns {Promise<Object>} 初始化後的玩家資料
     */
    async initializePlayer(userId, username, options = {}) {
        try {
            // 檢查玩家是否已存在
            const existingPlayer = await prisma.player.findUnique({
                where: {userId}
            });

            if (existingPlayer && existingPlayer.initialized) {
                return existingPlayer;
            }

            // 設置初始資金
            const initialMoney = options.initialMoney || 10000;

            // 設置初始職業（如果有）
            const occupation = options.occupation || null;

            // 創建或更新玩家資料
            const player = await prisma.player.upsert({
                where: {userId},
                update: {
                    username,
                    money: initialMoney,
                    occupation,
                    gameTime: 0,
                    initialized: true,
                    enterpriseCount: 0,
                    isProfilePublic: true,
                    lastActiveAt: new Date()
                },
                create: {
                    userId,
                    username,
                    money: initialMoney,
                    occupation,
                    gameTime: 0,
                    initialized: true,
                    enterpriseCount: 0,
                    isProfilePublic: true,
                    lastActiveAt: new Date()
                }
            });

            // 記錄玩家創建日誌
            logger.info(`玩家初始化: ${username} (${userId}) - 初始資金: $${initialMoney}`);

            return player;
        } catch (error) {
            logger.error(`初始化玩家時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 獲取玩家資料
     * @param {String} userId - Discord 用戶 ID
     * @param {Boolean} includePrivate - 是否包含私密資料
     * @returns {Promise<Object>} 玩家資料
     */
    async getPlayer(userId, includePrivate = false) {
        try {
            const player = await prisma.player.findUnique({
                where: {userId},
                include: {
                    enterprises: includePrivate,
                    achievements: includePrivate
                }
            });

            if (!player) {
                return null;
            }

            // 如果不需要私密資料且玩家設置為私密，則過濾資料
            if (!includePrivate && !player.isProfilePublic) {
                return {
                    userId: player.userId,
                    username: player.username,
                    initialized: player.initialized,
                    isProfilePublic: player.isProfilePublic
                };
            }

            return player;
        } catch (error) {
            logger.error(`獲取玩家資料時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 檢查玩家是否已初始化
     * @param {String} userId - Discord 用戶 ID
     * @returns {Promise<Boolean>} 是否已初始化
     */
    async isPlayerInitialized(userId) {
        try {
            const player = await prisma.player.findUnique({
                where: {userId},
                select: {initialized: true}
            });

            return player ? player.initialized : false;
        } catch (error) {
            logger.error(`檢查玩家初始化狀態時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 更新玩家資料
     * @param {String} userId - Discord 用戶 ID
     * @param {Object} data - 要更新的資料
     * @returns {Promise<Object>} 更新後的玩家資料
     */
    async updatePlayer(userId, data) {
        try {
            const player = await prisma.player.update({
                where: {userId},
                data
            });

            return player;
        } catch (error) {
            logger.error(`更新玩家資料時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 更新玩家金錢
     * @param {String} userId - Discord 用戶 ID
     * @param {Number} amount - 金錢變動量（正數增加，負數減少）
     * @returns {Promise<Object>} 更新後的玩家資料
     */
    async updatePlayerMoney(userId, amount) {
        try {
            // 開始事務處理
            return await prisma.$transaction(async (tx) => {
                // 獲取當前玩家資料
                const player = await tx.player.findUnique({
                    where: {userId},
                    select: {money: true}
                });

                if (!player) {
                    throw new Error(`找不到玩家 ${userId}`);
                }

                // 計算新金額
                const newAmount = player.money + amount;

                // 確保金額不會小於 0
                if (newAmount < 0) {
                    throw new Error('餘額不足');
                }

                // 更新玩家金錢
                const updatedPlayer = await tx.player.update({
                    where: {userId},
                    data: {money: newAmount}
                });

                // 記錄交易
                await tx.transaction.create({
                    data: {
                        playerId: userId,
                        amount,
                        balance: newAmount,
                        type: amount >= 0 ? 'INCOME' : 'EXPENSE',
                        description: amount >= 0 ? '收入' : '支出'
                    }
                });

                return updatedPlayer;
            });
        } catch (error) {
            logger.error(`更新玩家金錢時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 轉帳
     * @param {String} senderId - 發送者 ID
     * @param {String} receiverId - 接收者 ID
     * @param {Number} amount - 金額
     * @param {String} description - 交易描述
     * @returns {Promise<Object>} 交易結果
     */
    async transferMoney(senderId, receiverId, amount, description = '轉帳') {
        try {
            // 金額必須為正數
            if (amount <= 0) {
                throw new Error('轉帳金額必須為正數');
            }

            // 開始事務處理
            return await prisma.$transaction(async (tx) => {
                // 獲取發送者資料
                const sender = await tx.player.findUnique({
                    where: {userId: senderId},
                    select: {money: true, username: true}
                });

                if (!sender) {
                    throw new Error('找不到發送者');
                }

                // 檢查餘額是否足夠
                if (sender.money < amount) {
                    throw new Error('餘額不足');
                }

                // 獲取接收者資料
                const receiver = await tx.player.findUnique({
                    where: {userId: receiverId},
                    select: {money: true, username: true}
                });

                if (!receiver) {
                    throw new Error('找不到接收者');
                }

                // 更新發送者金錢
                await tx.player.update({
                    where: {userId: senderId},
                    data: {money: sender.money - amount}
                });

                // 記錄發送者交易
                await tx.transaction.create({
                    data: {
                        playerId: senderId,
                        amount: -amount,
                        balance: sender.money - amount,
                        type: 'EXPENSE',
                        description: `轉帳給 ${receiver.username}: ${description}`
                    }
                });

                // 更新接收者金錢
                await tx.player.update({
                    where: {userId: receiverId},
                    data: {money: receiver.money + amount}
                });

                // 記錄接收者交易
                await tx.transaction.create({
                    data: {
                        playerId: receiverId,
                        amount: amount,
                        balance: receiver.money + amount,
                        type: 'INCOME',
                        description: `來自 ${sender.username} 的轉帳: ${description}`
                    }
                });

                return {
                    success: true,
                    sender: sender.username,
                    receiver: receiver.username,
                    amount
                };
            });
        } catch (error) {
            logger.error(`轉帳時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 重置玩家資料
     * @param {String} userId - Discord 用戶 ID
     * @returns {Promise<Object>} 重置結果
     */
    async resetPlayer(userId) {
        try {
            // 開始事務處理
            return await prisma.$transaction(async (tx) => {
                // 獲取玩家資料
                const player = await tx.player.findUnique({
                    where: {userId},
                    include: {enterprises: true}
                });

                if (!player) {
                    throw new Error('找不到玩家');
                }

                // 刪除所有企業
                if (player.enterprises.length > 0) {
                    await tx.enterprise.deleteMany({
                        where: {ownerId: userId}
                    });
                }

                // 刪除所有交易記錄
                await tx.transaction.deleteMany({
                    where: {playerId: userId}
                });

                // 重置玩家資料
                await tx.player.update({
                    where: {userId},
                    data: {
                        money: 10000,
                        gameTime: 0,
                        enterpriseCount: 0,
                        initialized: false
                    }
                });

                return {success: true, username: player.username};
            });
        } catch (error) {
            logger.error(`重置玩家資料時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 更新玩家遊戲時間
     * @param {String} userId - Discord 用戶 ID
     * @param {Number} time - 增加的時間（小時）
     * @returns {Promise<Object>} 更新後的玩家資料
     */
    async updatePlayerGameTime(userId, time) {
        try {
            const player = await prisma.player.update({
                where: {userId},
                data: {
                    gameTime: {
                        increment: time
                    },
                    lastActiveAt: new Date()
                }
            });

            return player;
        } catch (error) {
            logger.error(`更新玩家遊戲時間時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 設置玩家隱私設定
     * @param {String} userId - Discord 用戶 ID
     * @param {Boolean} isPublic - 是否公開
     * @returns {Promise<Object>} 更新後的玩家資料
     */
    async setPlayerPrivacy(userId, isPublic) {
        try {
            const player = await prisma.player.update({
                where: {userId},
                data: {isProfilePublic: isPublic}
            });

            return player;
        } catch (error) {
            logger.error(`設置玩家隱私設定時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 獲取玩家交易記錄
     * @param {String} userId - Discord 用戶 ID
     * @param {Number} limit - 限制數量
     * @param {Number} offset - 偏移量
     * @returns {Promise<Array>} 交易記錄
     */
    async getPlayerTransactions(userId, limit = 10, offset = 0) {
        try {
            const transactions = await prisma.transaction.findMany({
                where: {playerId: userId},
                orderBy: {createdAt: 'desc'},
                take: limit,
                skip: offset
            });

            return transactions;
        } catch (error) {
            logger.error(`獲取玩家交易記錄時出錯: ${error.message}`, error);
            throw error;
        }
    }

    /**
     * 格式化金錢顯示
     * @param {Number} amount - 金額
     * @returns {String} 格式化後的金額
     */
    formatMoney(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * 檢查玩家是否可以執行操作（金錢是否足夠）
     * @param {String} userId - Discord 用戶 ID
     * @param {Number} requiredAmount - 所需金額
     * @returns {Promise<Boolean>} 是否可以執行
     */
    async canPlayerAfford(userId, requiredAmount) {
        try {
            const player = await prisma.player.findUnique({
                where: {userId},
                select: {money: true}
            });

            if (!player) {
                return false;
            }

            return player.money >= requiredAmount;
        } catch (error) {
            logger.error(`檢查玩家金錢時出錯: ${error.message}`, error);
            return false;
        }
    }
}

export const playerManager = new PlayerManager();
