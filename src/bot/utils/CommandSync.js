// 📁 src/bot/utils/CommandSync.js
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { logger } from '../utils/Logging.js';

const require = createRequire(import.meta.url);
const config = require('../../config/config.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 收集所有指令定義
export async function collectCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');

  const entries = fs.readdirSync(commandsPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(commandsPath, entry.name);

    if (entry.isFile() && entry.name.endsWith('.js')) {
      const command = await import(fullPath);
      if (command?.default?.data) {
        commands.push(command.default.data.toJSON());
      }
    } else if (entry.isDirectory()) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.js'));
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const command = await import(filePath);
        if (command?.default?.data) {
          commands.push(command.default.data.toJSON());
        }
      }
    }
  }

  return commands;
}

export async function syncAllGuildCommands(client) {
  logger.info(`開始同步指令：GUILD ${guildId}`);
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const commands = await collectCommands();

  const guilds = await client.guilds.fetch();
  for (const [guildId] of guilds) {
    try {
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
