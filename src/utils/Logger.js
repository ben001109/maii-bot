// src/utils/Logger.js

import pino from 'pino';
import {config} from '../config/index.js';

/**
 * Logger configuration based on environment
 */
const pinoConfig = {
    level: config.environment === 'development' ? 'debug' : 'info',
    transport: config.environment === 'development'
        ? {target: 'pino-pretty'}
        : undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return {level: label};
        },
    },
};

/**
 * Central logger instance for consistent logging across the application
 */
export const logger = pino({
    ...pinoConfig,
    name: 'maii-bot',
});

/**
 * Create a named child logger for specific components
 * @param {string} name - Component name for the logger
 * @returns {import('pino').Logger} Child logger instance
 */
export function createLogger(name) {
    return logger.child({name});
}

export default logger;
