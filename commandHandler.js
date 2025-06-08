import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

export class CommandHandler {
  constructor() {
    this.commands = new Map();
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
      const { name, execute } = commandModule;
      if (name && typeof execute === 'function') {
        this.commands.set(name, execute);
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
}
