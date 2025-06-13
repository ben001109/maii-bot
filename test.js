import assert from 'assert';
import { add } from './index.js';
import { CommandHandler } from './commandHandler.js';
import logger from './logger.js';
import {
  deposit,
  withdraw,
  getBalance,
  reset,
  initAccount,
} from './economy/account.js';
import { deposit, withdraw, getBalance, reset } from './economy/account.js';
import { format } from './economy/currency.js';

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

// Economy tests
reset();
assert.strictEqual(initAccount('test'), true);
assert.strictEqual(initAccount('test'), false);
deposit('test', 100);
assert.strictEqual(getBalance('test'), 100);
withdraw('test', 40);
assert.strictEqual(getBalance('test'), 60);
assert.throws(() => withdraw('test', 100));
assert.strictEqual(format(60), 'NT$60');

logger.info('All tests passed!');
