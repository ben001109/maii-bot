// 📁 src/bot/utils/SlashHandler.js

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Collection } from 'discord.js';
import { logger } from '../Logging.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 遞迴載入所有 slash 指令模組
 * @param {import('discord.js').Client} client Discord 客戶端
 */
export async function loadSlashCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  const commands = new Collection();
  const errors = [];

  async function loadCommandFile(filePath) {
    try {
      const commandModule = await import(filePath);
      const command = commandModule?.default;

      if (!command?.data?.name) {
        logger.warn(`[Slash] 無效指令模組：${filePath}`);
        return;
      }

      commands.set(command.data.name, command);
      logger.info(`[Slash] ✅ 載入指令：${command.data.name}`);
    } catch (err) {
      logger.error(`[Slash] ❌ 載入失敗：${filePath}`, err);
      errors.push({ file: filePath, error: err });
    }
  }

  function scanDirRecursively(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDirRecursively(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        loadPromises.push(loadCommandFile(fullPath));
      }
    }
  }

  const loadPromises = [];
  scanDirRecursively(commandsDir);
  await Promise.all(loadPromises);

  client.commands = commands;

  if (errors.length > 0) {
    throw new Error(`[Slash] 有 ${errors.length} 個指令模組載入失敗，詳情請參考 logs`);
  }
}