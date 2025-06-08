import logger from './logger.js';

export function add(a, b) {
  const result = a + b;
  logger.info(`add called with ${a} and ${b}, returning ${result}`);
  return result;
}
// Entry point to start bot and API
require('./API/index');
require('./bot/index');
=======
export function add(a, b) {
  return a + b;
}

