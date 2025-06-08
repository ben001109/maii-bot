import assert from 'assert';
import { add } from './index.js';
import logger from './logger.js';

assert.strictEqual(add(1, 2), 3);
logger.info('All tests passed!');
