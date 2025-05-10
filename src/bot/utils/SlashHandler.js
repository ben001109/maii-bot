import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadSlashCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  client.commands = new Map();

  // 遍歷 commands 目錄
  const commandFiles = fs.readdirSync(commandsPath, { withFileTypes: true });

  for (const entry of commandFiles) {
    const fullPath = path.join(commandsPath, entry.name);

    if (entry.isFile() && entry.name.endsWith('.js')) {
      // 載入根目錄下的 .js 檔案指令
      const command = await import(fullPath);
      if (command?.default?.data) {
        client.commands.set(command.default.data.name, command.default);
        console.log(`📄 載入根指令：${command.default.data.name}`);
      }
    } else if (entry.isDirectory()) {
      // 遍歷子目錄內的 .js 檔案
      const subFiles = fs.readdirSync(fullPath).filter(f => f.endsWith('.js'));
      for (const file of subFiles) {
        const filePath = path.join(fullPath, file);
        const command = await import(filePath);
        if (command?.default?.data) {
          client.commands.set(command.default.data.name, command.default);
          console.log(`📂 載入子指令：${command.default.data.name}`);
        }
      }
    }
  }
}
