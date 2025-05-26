// src/utils/Permissions.js

import {adminManager} from '../models/AdminManager.js';
import {config} from '../config/config.js';
import {logger} from './Logger.js';

/**
 * 權限檢查工具
 * 提供權限驗證與檢查的相關功能
 */
export const Permissions = {
    /**
     * 檢查用戶是否有指定權限
     * @param {string} userId - Discord 用戶 ID
     * @param {string} permission - 需要的權限
     * @returns {Promise<boolean>} 是否有權限
     */
    async hasPermission(userId, permission) {
        try {
            // 特殊處理 - 超級管理員
            if (userId === config.discord.ownerId) {
                return true;
            }

            // 檢查管理員權限
            return await adminManager.hasPermission(userId, permission);
        } catch (error) {
            logger.error(`檢查用戶 ${userId} 權限失敗:`, error);
            return false;
        }
    },

    /**
     * 中間件：權限檢查
     * 用於指令前檢查用戶是否有指定權限
     * @param {string|string[]} requiredPermission - 需要的權限或權限列表
     * @returns {Function} 中間件函數
     */
    checkPermission(requiredPermission) {
        return async (interaction) => {
            const userId = interaction.user.id;

            // 特殊處理 - 超級管理員
            if (userId === config.discord.ownerId) {
                return true;
            }

            // 處理權限陣列
            const permissions = Array.isArray(requiredPermission)
                ? requiredPermission
                : [requiredPermission];

            // 檢查是否擁有任一所需權限
            for (const permission of permissions) {
                if (await adminManager.hasPermission(userId, permission)) {
                    return true;
                }
            }

            // 沒有權限，回傳錯誤
            await interaction.reply({
                content: '⛔ 你沒有執行此指令的權限',
                ephemeral: true
            });

            return false;
        };
    },

    /**
     * 權限定義常數
     */
    PERMISSIONS: {
        // 系統級權限
        ADMIN: 'ADMIN',                     // 管理員 (所有權限)
        SUPER_USER: 'SUPER_USER',           // 超級用戶 (除了系統設置外的所有權限)

        // 一般管理權限
        MANAGE_USERS: 'MANAGE_USERS',       // 管理用戶
        MANAGE_ECONOMY: 'MANAGE_ECONOMY',   // 管理經濟系統
        MANAGE_ITEMS: 'MANAGE_ITEMS',       // 管理物品
        MANAGE_SHOPS: 'MANAGE_SHOPS',       // 管理商店

        // 一般權限
        VIEW_ADMIN: 'VIEW_ADMIN',           // 查看管理面板
        USE_BASIC_COMMANDS: 'USE_BASIC_COMMANDS', // 使用基本指令
    }
};

export default Permissions;
