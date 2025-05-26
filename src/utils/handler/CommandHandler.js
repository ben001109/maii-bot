// src/utils/handler/CommandHandler.js

import {Collection} from 'discord.js';
import {promises as fs} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {logger} from '../Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 遞迴載入指令檔案
 * @param {string} directory - 要掃描的目錄
 * @param {Collection} commandsCollection - 用於儲存指令的集合
 * @returns {Promise<Collection>} 載入的指令集合
 */
async function loadCommandsFromDirectory(directory, commandsCollection) {
    try {
        const items = await fs.readdir(directory, {withFileTypes: true});

        for (const item of items) {
            const itemPath = join(directory, item.name);

            if (item.isDirectory()) {
                // 遞迴處理子目錄
                await loadCommandsFromDirectory(itemPath, commandsCollection);
            } else if (item.name.endsWith('.js')) {
                try {
                    // 導入指令模組
                    const {default: command} = await import(`file://${itemPath}`);

                    // 跳過不包含有效指令的檔案
                    if (!command || !command.data || !command.execute) {
                        logger.warn(`無效的指令模組: ${itemPath}`);
                        continue;
                    }

                    // 將檔案路徑儲存到指令中，以便重新載入
                    command.filePath = itemPath;

                    // 新增指令到集合
                    commandsCollection.set(command.data.name, command);
                    logger.debug(`已載入指令: ${command.data.name}`);
                } catch (error) {
                    logger.error(`載入指令時發生錯誤 ${itemPath}:`, error);
                }
            }
        }

        return commandsCollection;
    } catch (error) {
        logger.error(`載入指令目錄時發生錯誤 ${directory}:`, error);
        return commandsCollection;
    }
}

/**
 * 自動發現指令目錄並載入所有指令
 * @param {import('discord.js').Client} client - Discord.js 客戶端實例
 * @returns {Promise<Collection>} 載入的指令集合
 */
export async function loadSlashCommands(client) {
    // 檢查 src/commands 和 src/bot/commands 兩個可能的指令路徑
    const possiblePaths = [
        join(__dirname, '../../commands'),           // src/commands
        join(__dirname, '../../../bot/commands')     // src/bot/commands
    ];
    
    const commands = new Collection();
    let commandsLoaded = 0;
    
    try {
        // 嘗試從每個可能的路徑載入指令
        for (const commandsPath of possiblePaths) {
            try {
                // 檢查目錄是否存在
                await fs.access(commandsPath);

                // 讀取目錄內容
                const items = await fs.readdir(commandsPath, {withFileTypes: true});

                // 處理所有分類目錄或指令文件
                for (const item of items) {
                    const itemPath = join(commandsPath, item.name);

                    if (item.isDirectory()) {
                        // 從分類目錄載入指令
                        await loadCommandsFromDirectory(itemPath, commands);
                    } else if (item.name.endsWith('.js')) {
                        // 直接從根目錄載入指令
                        try {
                            const {default: command} = await import(`file://${itemPath}`);

                            if (!command || !command.data || !command.execute) {
                                logger.warn(`無效的指令模組: ${itemPath}`);
                                continue;
                            }

                            command.filePath = itemPath;
                            commands.set(command.data.name, command);
                            logger.debug(`已載入指令: ${command.data.name}`);
                        } catch (error) {
                            logger.error(`載入指令時發生錯誤 ${itemPath}:`, error);
                        }
                    }
                }

                logger.info(`從 ${commandsPath} 載入指令`);
                commandsLoaded++;

            } catch (error) {
                // 如果目錄不存在則跳過
                if (error.code === 'ENOENT') {
                    logger.debug(`指令目錄不存在: ${commandsPath}`);
                } else {
                    logger.error(`訪問指令目錄時發生錯誤 ${commandsPath}:`, error);
                }
            }
        }

        if (commandsLoaded === 0) {
            logger.warn(`未找到任何指令目錄，已檢查: ${possiblePaths.join(', ')}`);
        }

        // 將指令儲存到 client 以便輕鬆訪問
        client.commands = commands;

        // 儲存 guild ID 以供後續使用
        try {
            const guilds = await client.guilds.fetch();
            client.guildIds = Array.from(guilds.keys());
            logger.info(`已載入 ${client.guildIds.length} 個伺服器 ID`);
        } catch (error) {
            logger.error('無法擷取伺服器 ID 列表:', error);
            client.guildIds = [];
        }

        logger.info(`已成功載入 ${commands.size} 個指令`);
        return commands;
    } catch (error) {
        logger.error('無法載入斜線指令:', error);
        throw error;
    }
}

/**
 * 重新載入特定指令，開發時有用
 * @param {import('discord.js').Client} client - Discord.js 客戶端實例
 * @param {string} commandName - 要重新載入的指令名稱
 * @returns {Promise<boolean>} 成功狀態
 */
export async function reloadCommand(client, commandName) {
    try {
        const command = client.commands.get(commandName);
        if (!command) {
            logger.warn(`找不到要重新載入的指令: ${commandName}`);
            return false;
        }

        // 獲取指令路徑
        const commandPath = command.filePath;
        if (!commandPath) {
            logger.error(`指令 ${commandName} 缺少 filePath 屬性，無法重新載入`);
            return false;
        }

        // 從集合中移除指令
        client.commands.delete(commandName);

        // 重新載入指令
        try {
            const {default: newCommand} = await import(`file://${commandPath}?update=${Date.now()}`);

            if (!newCommand || !newCommand.data || !newCommand.execute) {
                logger.error(`重新載入的指令 ${commandName} 無效`);
                return false;
            }

            newCommand.filePath = commandPath;
            client.commands.set(newCommand.data.name, newCommand);

            logger.info(`已重新載入指令: ${commandName}`);
            return true;
        } catch (error) {
            logger.error(`重新載入指令 ${commandName} 時發生錯誤:`, error);
            return false;
        }
    } catch (error) {
        logger.error(`重新載入指令 ${commandName} 時發生錯誤:`, error);
        return false;
    }
}

/**
 * 監聽 guild 加入事件的處理器
 * @param {import('discord.js').Client} client - Discord.js 客戶端實例
 * @param {import('discord.js').Guild} guild - 新加入的伺服器
 */
export function handleGuildJoin(client, guild) {
    if (!client.guildIds) {
        client.guildIds = [];
    }

    // 添加新的 guild ID 到列表
    if (!client.guildIds.includes(guild.id)) {
        client.guildIds.push(guild.id);
        logger.info(`新增伺服器 ID 到列表: ${guild.id} (${guild.name})`);
    }
}

export default {
    loadSlashCommands,
    reloadCommand,
    handleGuildJoin
};
