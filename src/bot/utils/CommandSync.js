// 📁 src/bot/utils/CommandSync.js
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { logger } from './Logging.js';

const require = createRequire(import.meta.url);
const config = require('../../config/config.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 遞迴收集所有指令定義
 * @returns {Promise<Array<Object>>}
 */
export async function collectCommands() {
  const commands = [];
  const commandsDir = path.join(__dirname, '..', 'commands');

  async function loadCommandFile(filePath) {
    const command = await import(filePath);
    if (command?.default?.data) {
      commands.push(command.default.data.toJSON());
    }
  }

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        loadPromises.push(loadCommandFile(fullPath));
      }
    }
  }

  const loadPromises = [];
  scanDir(commandsDir);
  await Promise.all(loadPromises);

  return commands;
}

/**
 * 將所有指令同步到每個伺服器
 * @param {import('discord.js').Client} client
 */
export async function syncAllGuildCommands(client) {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const commands = await collectCommands();

  const guilds = await client.guilds.fetch();
  for (const [guildId] of guilds) {
    try {
      logger.info(`📡 正在同步指令：GUILD ${guildId}`);
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        { body: commands }
      );
      logger.info(`✅ 指令同步成功：GUILD ${guildId}`);
    } catch (error) {
      logger.error(`❌ 指令同步失敗：GUILD ${guildId}`, error);
    }
  }
}