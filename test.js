import assert from 'assert';
import { add } from './index.js';
import { CommandHandler } from './commandHandler.js';
import logger from './logger.js';

assert.strictEqual(add(1, 2), 3);

const handler = new CommandHandler();
await handler.loadCommands(new URL('./bot/commands/', import.meta.url));
const result = await handler.execute('ping');
assert.strictEqual(result, 'pong');

let synced = false;
handler.on('synced', () => {
  synced = true;
});

await handler.syncCommands({
  application: { commands: { set: async () => [] } },
});
assert.strictEqual(synced, true);

logger.info('All tests passed!');
