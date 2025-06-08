import logger from './logger.js';
import './API/index.js';
import './bot/index.js';

export function add(a, b) {
  const result = a + b;
  logger.info(`add called with ${a} and ${b}, returning ${result}`);
  return result;
}
