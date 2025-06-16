import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { EventEmitter } from 'events';

export class SlashHandler extends EventEmitter {
  constructor() {
    super();
    this.commands = new Map();
    this.slashCommands = [];
  }

  async loadCommands(directory) {
    const dirPath =
      directory instanceof URL ? directory : path.resolve(directory);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir =
          directory instanceof URL
            ? new URL(`${entry.name}/`, directory)
            : path.join(dirPath, entry.name);
        await this.loadCommands(subDir);
        continue;
      }
      if (!entry.name.endsWith('.js')) continue;
      const fileUrl =
        directory instanceof URL
          ? new URL(entry.name, directory)
          : pathToFileURL(path.join(dirPath, entry.name));
      const commandModule = await import(fileUrl.href);
      const { name, execute, slashCommand } = commandModule;
      if (name && typeof execute === 'function') {
        this.commands.set(name, execute);
      }
      if (slashCommand) {
        this.slashCommands.push(slashCommand);
      }
    }
  }

  async execute(name, ...args) {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`Command "${name}" not found`);
    }
    return command(...args);
  }

  async syncCommands(client) {
    if (!client?.application?.commands?.set) {
      throw new Error('Invalid Discord client');
    }
    const data = await client.application.commands.set(
      this.slashCommands.map((c) => c.data.toJSON()),
    );
    this.emit('synced', data);
    return data;
  }
}
