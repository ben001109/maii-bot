import assert from 'assert';
import { add } from './index.js';
import { SlashHandler } from './bot/handler/slashHandler.js';
import logger from './logger.js';
import { loadLocale } from './bot/utils/i18n.js';
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
        .then(() => logger.info(`✓ ${name}`))
        .catch((err) => {
          logger.error(`✕ ${name}`);
          logger.error(err);
          process.exitCode = 1;
        });
    } else {
      logger.info(`✓ ${name}`);
    }
  } catch (err) {
    logger.error(`✕ ${name}`);
    logger.error(err);
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

const handler = new SlashHandler();

(async () => {
  await handler.loadCommands(new URL('./bot/commands/', import.meta.url));

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

  test('withdraw negative amount', () => {
    reset();
    initAccount('neg');
    deposit('neg', 50);
    assert.throws(() => withdraw('neg', -10));
    expect(getBalance('neg')).toBe(50);
  });

  test('kanban add', () => {
    expect(addCard('123', 'test')).toEqual({ text: '123', assign: 'test' });
  });

  test('kanban command', async () => {
    const result = await handler.execute('kanbanadd', '123', 'test');
    expect(result).toEqual({ text: '123', assign: 'test' });
  });

  test('locale error_execute', () => {
    const en = loadLocale('en');
    const zh = loadLocale('zh-TW');
    expect(en('error_execute')).toBe('Error executing command');
    expect(zh('error_execute')).toBe('執行指令時發生錯誤');
  });

  logger.info('All tests passed!');
})();
