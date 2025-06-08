import { CommandHandler } from '../commandHandler.js';

const handler = new CommandHandler();
await handler.loadCommands(new URL('./commands/', import.meta.url));

export async function runCommand(name, ...args) {
  return handler.execute(name, ...args);
}

// Example usage if this file is run directly
if (
  import.meta.url === process.argv[1] ||
  import.meta.url === `file://${process.argv[1]}`
) {
  handler.execute('ping').then(console.log).catch(console.error);
}
