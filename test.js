import assert from 'assert';
import { add } from './index.js';
import { CommandHandler } from './bot/handler/commandHandler.js';
import logger from './logger.js';
import {
  deposit,
  withdraw,
  getBalance,
  reset,
  initAccount,
} from './bot/handler/ecom/account.js';
import { format } from './bot/handler/ecom/currency.js';
import { addCard } from './src/kanban/index.js';

function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => console.log(`✓ ${name}`))
        .catch((err) => {
          console.error(`✕ ${name}`);
          console.error(err);
          process.exitCode = 1;
        });
    } else {
      console.log(`✓ ${name}`);
    }
  } catch (err) {
    console.error(`✕ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected);
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected);
    },
  };
}

const handler = new CommandHandler();
await handler.loadCommands(new URL('./bot/commands/', import.meta.url));
await handler.loadCommands(new URL('./bot/commands/ecom/', import.meta.url));

test('add function', () => {
  expect(add(1, 2)).toBe(3);
});

test('ping command', async () => {
  const result = await handler.execute('ping');
  expect(result).toBe('pong');
});

test('sync commands event', async () => {
  let synced = false;
  handler.on('synced', () => {
    synced = true;
  });
  await handler.syncCommands({
    application: { commands: { set: async () => [] } },
  });
  expect(synced).toBe(true);
});

test('economy functions', () => {
  reset();
  expect(initAccount('test')).toBe(true);
  expect(initAccount('test')).toBe(false);
  deposit('test', 100);
  expect(getBalance('test')).toBe(100);
  withdraw('test', 40);
  expect(getBalance('test')).toBe(60);
  assert.throws(() => withdraw('test', 100));
  expect(format(60)).toBe('NT$60');
});

test('kanban add', () => {
  expect(addCard('123', 'test')).toEqual({ text: '123', assign: 'test' });
});

test('kanban command', async () => {
  const result = await handler.execute('kanbanadd', '123', 'test');
  expect(result).toEqual({ text: '123', assign: 'test' });
});

logger.info('All tests passed!');
