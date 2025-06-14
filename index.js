import logger from './logger.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  await import('./API/index.js');
  await import('./bot/index.js');
}

export function add(a, b) {
  const result = a + b;
  logger.info(`add called with ${a} and ${b}, returning ${result}`);
  return result;
}
