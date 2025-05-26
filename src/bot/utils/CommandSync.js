// 📁 src/bot/utils/CommandSync.js
import {REST, Routes} from 'discord.js';
import {logger} from './Logging.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../../config/config.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 收集所有指令資料（從已載入的 client.commands 或掃描檔案系統）
 * @param {import('discord.js').Client} client - Discord.js 客戶端實例
 * @returns {Promise<Array>} 指令資料陣列
 */
export async function collectCommands(client) {
    // 如果 client 已有載入的指令集合，使用這些指令
    if (client && client.commands && client.commands.size > 0) {
        logger.debug(`從 client.commands 中收集 ${client.commands.size} 個指令`);
        const commandsData = [];
        for (const command of client.commands.values()) {
            commandsData.push(command.data.toJSON());
        }
        return commandsData;
  }

    // 否則發出警告
    logger.warn('無法從 client.commands 收集指令，請確保 loadSlashCommands() 已被執行');
    return [];
}

/**
 * 將所有指令同步到每個伺服器
 * @param {import('discord.js').Client} client - Discord.js 客戶端實例
 * @param {string|null} specificGuildId - 可選，僅同步指定伺服器的指令
 * @returns {Promise<{success: number, failed: number}>} 成功和失敗的數量
 */
export async function syncAllGuildCommands(client, specificGuildId = null) {
    // 檢查 client 是否有效
    if (!client || !client.user) {
        logger.error('同步指令失敗：client 尚未登入或初始化');
        return {success: 0, failed: 0};
    }

    try {
        const rest = new REST({version: '10'}).setToken(config.discordToken);
        const commands = await collectCommands(client);

        if (commands.length === 0) {
            logger.warn('沒有指令可同步，請確保指令已正確載入');
            return {success: 0, failed: 0};
        }

        // 如果提供了特定的 guildId，則僅同步該伺服器
        if (specificGuildId) {
            const success = await syncGuildCommands(rest, client.user.id, specificGuildId, commands);
            return {success: success ? 1 : 0, failed: success ? 0 : 1};
        }

        // 否則同步所有伺服器
        const guilds = await client.guilds.fetch();
        let successCount = 0;
        let failCount = 0;

        for (const [guildId] of guilds) {
            const success = await syncGuildCommands(rest, client.user.id, guildId, commands);
            if (success) successCount++;
            else failCount++;
        }

        logger.info(`🔄 指令同步完成: ✅ ${successCount} 個成功, ❌ ${failCount} 個失敗`);
        return {success: successCount, failed: failCount};
    } catch (error) {
        logger.error(`🔄 同步指令過程中發生錯誤: ${error.message}`);
        return {success: 0, failed: 0};
    }
}

/**
 * 同步單一伺服器的指令
 * @param {REST} rest - Discord REST API 客戶端
 * @param {string} clientId - 機器人的用戶 ID
 * @param {string} guildId - 目標伺服器 ID
 * @param {Array} commands - 指令資料陣列
 * @returns {Promise<boolean>} 是否成功
 */
async function syncGuildCommands(rest, clientId, guildId, commands) {
    try {
        logger.info(`📡 正在同步指令：GUILD ${guildId}`);

        const response = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            {body: commands}
        );

        logger.info(`✅ 指令同步成功：GUILD ${guildId} (${response.length} 個指令)`);
        return true;
    } catch (error) {
        // 如果 Discord.js RESTError 有 response body，顯示更細的內容
        let details = '';
        if (error?.rawError) {
            details = JSON.stringify(error.rawError, null, 2);
        } else if (error?.body) {
            details = JSON.stringify(error.body, null, 2);
        } else {
            details = error?.message || error;
        }

        logger.error(`❌ 指令同步失敗：GUILD ${guildId}\n${details}`);
        return false;
    }
}

/**
 * 將全域指令同步到 Discord
 * @param {import('discord.js').Client} client - Discord.js 客戶端實例
 * @returns {Promise<boolean>} 是否成功
 */
export async function syncGlobalCommands(client) {
    if (!client || !client.user) {
        logger.error('同步全域指令失敗：client 尚未登入或初始化');
        return false;
    }

    try {
        const rest = new REST({version: '10'}).setToken(config.discordToken);
        const commands = await collectCommands(client);

        if (commands.length === 0) {
            logger.warn('沒有指令可同步，請確保指令已正確載入');
            return false;
        }

        logger.info('📡 正在同步全域指令...');

        const response = await rest.put(
            Routes.applicationCommands(client.user.id),
            {body: commands}
        );

        logger.info(`✅ 全域指令同步成功 (${response.length} 個指令)`);
        return true;
    } catch (error) {
        let details = error?.message || String(error);
        logger.error(`❌ 全域指令同步失敗\n${details}`);
        return false;
    }
}

/**
 * 處理伺服器加入事件的指令同步
 * @param {import('discord.js').Guild} guild - 新加入的伺服器
 * @returns {Promise<boolean>} 是否成功
 */
export async function handleGuildJoin(guild) {
    try {
        if (!guild || !guild.client || !guild.client.user) {
            logger.error('處理伺服器加入事件失敗：無效的 guild 或 client');
            return false;
        }

        logger.info(`🔔 機器人已加入新伺服器: ${guild.name} (${guild.id})`);

        // 同步指令到新加入的伺服器
        const result = await syncAllGuildCommands(guild.client, guild.id);
        return result.success > 0;
    } catch (error) {
        logger.error(`處理伺服器加入事件時發生錯誤: ${error.message}`);
        return false;
    }
}

export default {
    collectCommands,
    syncAllGuildCommands,
    syncGlobalCommands,
    handleGuildJoin
};