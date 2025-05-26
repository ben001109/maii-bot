// src/models/AdminManager.js

import {prisma} from '../db/prismaClient.js';
import {redis} from '../redis/redisClient.js';
import {logger} from '../utils/Logger.js';
import {config} from '../config/config.js';

const adminLogger = logger.child({name: 'admin'});

/**
 * 管理員權限管理類
 * - 使用 Redis 快取管理員信息
 * - 使用 Prisma 持久儲存管理員數據
 */
class AdminManager {
    constructor() {
        this.redisKeyPrefix = 'admin:';
        this.cacheExpiry = 3600; // 快取有效期 (秒)
        this.defaultPermissions = ['VIEW_ADMIN', 'USE_BASIC_COMMANDS'];
    }

    /**
     * 初始化管理員系統
     */
    async initialize() {
        try {
            // 確保至少有一個超級管理員
            const ownerId = config.discord.ownerId;
            if (ownerId) {
                await this.ensureOwnerAdmin(ownerId);
            }

            adminLogger.info('管理員系統初始化完成');
        } catch (error) {
            adminLogger.error('管理員系統初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 確保機器人擁有者是超級管理員
     * @param {string} ownerId - Discord ID
     */
    async ensureOwnerAdmin(ownerId) {
        try {
            const admin = await prisma.admin.findUnique({
                where: {discordId: ownerId}
            });

            if (!admin) {
                await prisma.admin.create({
                    data: {
                        discordId: ownerId,
                        username: 'BOT_OWNER',
                        permissions: ['ADMIN', 'SUPER_USER', ...this.defaultPermissions]
                    }
                });
                adminLogger.info(`已創建超級管理員 (${ownerId})`);
            } else if (!admin.permissions.includes('ADMIN')) {
                // 確保擁有者具有所有權限
                await prisma.admin.update({
                    where: {discordId: ownerId},
                    data: {
                        permissions: [...new Set([...admin.permissions, 'ADMIN', 'SUPER_USER'])]
                    }
                });
                adminLogger.info(`已更新超級管理員權限 (${ownerId})`);
            }

            // 更新 Redis 快取
            await this.refreshAdminCache(ownerId);
        } catch (error) {
            adminLogger.error(`確保擁有者權限失敗 (${ownerId}):`, error);
            throw error;
        }
    }

    /**
     * 檢查用戶是否為管理員
     * @param {string} discordId - Discord ID
     * @returns {Promise<boolean>} 是否為管理員
     */
    async isAdmin(discordId) {
        try {
            const admin = await this.getAdmin(discordId);
            return !!admin;
        } catch (error) {
            adminLogger.error(`檢查管理員狀態失敗 (${discordId}):`, error);
            return false;
        }
    }

    /**
     * 檢查用戶是否有指定權限
     * @param {string} discordId - Discord ID
     * @param {string} permission - 權限名稱
     * @returns {Promise<boolean>} 是否有權限
     */
    async hasPermission(discordId, permission) {
        try {
            const admin = await this.getAdmin(discordId);
            if (!admin) return false;

            // ADMIN 擁有所有權限
            if (admin.permissions.includes('ADMIN')) return true;

            return admin.permissions.includes(permission);
        } catch (error) {
            adminLogger.error(`檢查權限失敗 (${discordId}, ${permission}):`, error);
            return false;
        }
    }

    /**
     * 取得管理員資訊 (優先從 Redis 快取讀取)
     * @param {string} discordId - Discord ID
     * @returns {Promise<Object|null>} 管理員資訊
     */
    async getAdmin(discordId) {
        try {
            // 先從 Redis 快取讀取
            const cacheKey = `${this.redisKeyPrefix}${discordId}`;
            const cachedData = await redis.client.get(cacheKey);

            if (cachedData) {
                return JSON.parse(cachedData);
            }

            // 從資料庫讀取
            const admin = await prisma.admin.findUnique({
                where: {discordId}
            });

            if (!admin) return null;

            // 更新 Redis 快取
            await redis.client.set(
                cacheKey,
                JSON.stringify(admin),
                'EX',
                this.cacheExpiry
            );

            return admin;
        } catch (error) {
            adminLogger.error(`取得管理員失敗 (${discordId}):`, error);

            // 從資料庫讀取作為後備
            try {
                return await prisma.admin.findUnique({
                    where: {discordId}
                });
            } catch (dbError) {
                adminLogger.error(`從資料庫取得管理員失敗 (${discordId}):`, dbError);
                return null;
            }
        }
    }

    /**
     * 添加新管理員
     * @param {string} discordId - Discord ID
     * @param {string} username - Discord 用戶名
     * @param {string[]} permissions - 權限列表
     * @returns {Promise<Object>} 新建的管理員資訊
     */
    async addAdmin(discordId, username, permissions = []) {
        try {
            // 檢查用戶是否已是管理員
            const existingAdmin = await prisma.admin.findUnique({
                where: {discordId}
            });

            if (existingAdmin) {
                throw new Error(`用戶 ${discordId} 已是管理員`);
            }

            // 建立管理員
            const admin = await prisma.admin.create({
                data: {
                    discordId,
                    username,
                    permissions: [...this.defaultPermissions, ...permissions]
                }
            });

            // 更新 Redis 快取
            await this.refreshAdminCache(discordId);

            adminLogger.info(`已新增管理員 ${username} (${discordId})`);
            return admin;
        } catch (error) {
            adminLogger.error(`添加管理員失敗 (${discordId}):`, error);
            throw error;
        }
    }

    /**
     * 移除管理員
     * @param {string} discordId - Discord ID
     * @returns {Promise<boolean>} 是否成功移除
     */
    async removeAdmin(discordId) {
        try {
            // 檢查是否為超級管理員
            if (discordId === config.discord.ownerId) {
                throw new Error('不能移除超級管理員');
            }

            // 從資料庫移除
            await prisma.admin.delete({
                where: {discordId}
            });

            // 清除 Redis 快取
            const cacheKey = `${this.redisKeyPrefix}${discordId}`;
            await redis.client.del(cacheKey);

            adminLogger.info(`已移除管理員 (${discordId})`);
            return true;
        } catch (error) {
            adminLogger.error(`移除管理員失敗 (${discordId}):`, error);

            if (error.code === 'P2025') {
                // Prisma 錯誤: 記錄不存在
                return false;
            }

            throw error;
        }
    }

    /**
     * 更新管理員權限
     * @param {string} discordId - Discord ID
     * @param {string[]} permissions - 新的權限列表
     * @returns {Promise<Object|null>} 更新後的管理員資訊
     */
    async updatePermissions(discordId, permissions) {
        try {
            // 檢查用戶是否為管理員
            const admin = await prisma.admin.findUnique({
                where: {discordId}
            });

            if (!admin) {
                throw new Error(`用戶 ${discordId} 不是管理員`);
            }

            // 若為機器人擁有者，確保保留 ADMIN 權限
            if (discordId === config.discord.ownerId && !permissions.includes('ADMIN')) {
                permissions.push('ADMIN');
                permissions.push('SUPER_USER');
            }

            // 更新權限
            const updatedAdmin = await prisma.admin.update({
                where: {discordId},
                data: {permissions}
            });

            // 更新 Redis 快取
            await this.refreshAdminCache(discordId);

            adminLogger.info(`已更新管理員 (${discordId}) 權限`);
            return updatedAdmin;
        } catch (error) {
            adminLogger.error(`更新管理員權限失敗 (${discordId}):`, error);
            throw error;
        }
    }

    /**
     * 取得所有管理員列表
     * @returns {Promise<Object[]>} 管理員列表
     */
    async getAllAdmins() {
        try {
            return await prisma.admin.findMany({
                orderBy: {createdAt: 'asc'}
            });
        } catch (error) {
            adminLogger.error('取得管理員列表失敗:', error);
            throw error;
        }
    }

    /**
     * 檢查並添加權限
     * @param {string} discordId - Discord ID
     * @param {string} permission - 要添加的權限
     * @returns {Promise<boolean>} 是否成功添加
     */
    async addPermission(discordId, permission) {
        try {
            const admin = await this.getAdmin(discordId);
            if (!admin) return false;

            // 如果已有此權限則不操作
            if (admin.permissions.includes(permission)) {
                return true;
            }

            // 添加權限
            const updatedPermissions = [...admin.permissions, permission];
            await this.updatePermissions(discordId, updatedPermissions);
            return true;
        } catch (error) {
            adminLogger.error(`添加權限失敗 (${discordId}, ${permission}):`, error);
            return false;
        }
    }

    /**
     * 移除權限
     * @param {string} discordId - Discord ID
     * @param {string} permission - 要移除的權限
     * @returns {Promise<boolean>} 是否成功移除
     */
    async removePermission(discordId, permission) {
        try {
            const admin = await this.getAdmin(discordId);
            if (!admin) return false;

            // 如果是機器人擁有者且嘗試移除 ADMIN 權限，則拒絕
            if (discordId === config.discord.ownerId && permission === 'ADMIN') {
                return false;
            }

            // 移除權限
            const updatedPermissions = admin.permissions.filter(p => p !== permission);
            await this.updatePermissions(discordId, updatedPermissions);
            return true;
        } catch (error) {
            adminLogger.error(`移除權限失敗 (${discordId}, ${permission}):`, error);
            return false;
        }
    }

    /**
     * 刷新管理員 Redis 快取
     * @param {string} discordId - Discord ID
     * @returns {Promise<void>}
     */
    async refreshAdminCache(discordId) {
        try {
            const cacheKey = `${this.redisKeyPrefix}${discordId}`;

            // 從資料庫獲取最新資料
            const admin = await prisma.admin.findUnique({
                where: {discordId}
            });

            if (admin) {
                // 更新快取
                await redis.client.set(
                    cacheKey,
                    JSON.stringify(admin),
                    'EX',
                    this.cacheExpiry
                );
            } else {
                // 如果管理員不存在，清除快取
                await redis.client.del(cacheKey);
            }
        } catch (error) {
            adminLogger.error(`刷新管理員快取失敗 (${discordId}):`, error);
        }
    }

    /**
     * 清除所有管理員快取
     * @returns {Promise<void>}
     */
    async clearAllAdminCache() {
        try {
            // 使用 Redis 的 SCAN 指令獲取所有相關鍵
            let cursor = '0';
            do {
                const [newCursor, keys] = await redis.client.scan(
                    cursor,
                    'MATCH',
                    `${this.redisKeyPrefix}*`,
                    'COUNT',
                    100
                );

                cursor = newCursor;

                if (keys.length > 0) {
                    await redis.client.del(...keys);
                    adminLogger.debug(`已清除 ${keys.length} 個管理員快取`);
                }
            } while (cursor !== '0');

            adminLogger.info('已清除所有管理員快取');
        } catch (error) {
            adminLogger.error('清除管理員快取失敗:', error);
        }
    }
}

// 創建並導出單例
export const adminManager = new AdminManager();
export default adminManager;
