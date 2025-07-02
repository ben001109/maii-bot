import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import path from 'path';

/**
 * 統一的日誌管理器
 */
class Logger {
  constructor() {
    this.logDir = 'logs';
    this.ensureLogDirectory();
    this.logger = this.createLoggerInstance();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  createLoggerInstance() {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
      })
    );

    return createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        new transports.File({ 
          filename: path.join(this.logDir, 'error.log'),
          level: 'error'
        }),
        new transports.File({ 
          filename: path.join(this.logDir, 'combined.log')
        }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  createChildLogger(context) {
    return {
      info: (message, meta = {}) => this.info(message, { context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { context, ...meta }),
      error: (message, meta = {}) => this.error(message, { context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { context, ...meta })
    };
  }
}

export default new Logger();
