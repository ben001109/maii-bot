import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { EventEmitter } from 'events';

export class CommandHandler extends EventEmitter {
  constructor() {
    super();
    this.commands = new Map();
    this.slashCommands = [];
  }

  async loadCommands(directory) {
    const dirPath =
      directory instanceof URL ? directory : path.resolve(directory);
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const fileUrl =
        directory instanceof URL
          ? new URL(file, directory)
          : pathToFileURL(path.join(dirPath, file));
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
