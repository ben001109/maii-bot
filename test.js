import assert from 'assert';
import { add } from './index.js';
import { CommandHandler } from './commandHandler.js';

assert.strictEqual(add(1, 2), 3);

const handler = new CommandHandler();
await handler.loadCommands(new URL('./bot/commands/', import.meta.url));
const result = await handler.execute('ping');
assert.strictEqual(result, 'pong');

console.log('All tests passed!');
