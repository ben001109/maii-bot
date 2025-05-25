// 📁 src/db/prismaClient.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../bot/utils/Logging.js';
// src/db/prismaClient.js

import {PrismaClient} from '@prisma/client';
import {logger} from '../utils/Logger.js';

// Create logger for database operations
const dbLogger = logger.child({name: 'prisma'});

/**
 * Global instance of Prisma for development mode to prevent too many clients
 */
const globalForPrisma = globalThis;

/**
 * Enhanced Prisma client with logging and error handling
 */
class PrismaClientManager {
  constructor() {
    this.instance = null;
  }

  /**
   * Initialize the Prisma client
   * @returns {PrismaClient} Configured Prisma client instance
   */
  init() {
    // Reuse existing client in development to prevent too many connections
    if (globalForPrisma.prisma) {
      dbLogger.debug('Reusing existing Prisma client instance');
      this.instance = globalForPrisma.prisma;
      return this.instance;
    }

    // Create new client with logging middleware
    this.instance = new PrismaClient({
      log: [
        {level: 'warn', emit: 'event'},
        {level: 'error', emit: 'event'},
      ],
    });

    // Set up event handlers for logging
    this.instance.$on('warn', (e) => {
      dbLogger.warn('Prisma warning:', e);
    });

    this.instance.$on('error', (e) => {
      dbLogger.error('Prisma error:', e);
    });

    // Register query logging middleware in development
    if (process.env.NODE_ENV !== 'production') {
      this.instance.$use(async (params, next) => {
        const startTime = Date.now();
        const result = await next(params);
        const timeTaken = Date.now() - startTime;

        dbLogger.debug({
          model: params.model,
          action: params.action,
          timeTaken: `${timeTaken}ms`,
        });

        return result;
      });
    }

    // Store in global for reuse in development
    globalForPrisma.prisma = this.instance;

    dbLogger.info('Prisma client initialized');
    return this.instance;
  }

  /**
   * Get the Prisma client instance, initializing if needed
   * @returns {PrismaClient} Prisma client instance
   */
  get client() {
    if (!this.instance) {
      return this.init();
    }
    return this.instance;
  }

  /**
   * Wrapper for database transactions with error handling
   * @param {Function} callback - Function to execute within transaction
   * @returns {Promise<any>} Result of the transaction
   */
  async transaction(callback) {
    try {
      return await this.client.$transaction(callback);
    } catch (error) {
      dbLogger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect() {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
      dbLogger.info('Prisma client disconnected');
    }
  }
}

// Create and export Prisma client manager
const prismaManager = new PrismaClientManager();

// Export the Prisma client instance for direct use
export const prisma = prismaManager.client;

// Export the manager for advanced operations
export default prismaManager;
const IS_DEV = process.env.NODE_ENV !== 'production';
const globalRef = globalThis;

let prisma;

if (IS_DEV) {
  if (!globalRef._prisma) {
    globalRef._prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = globalRef._prisma;
} else {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
}

// ✅ Prisma 錯誤監控
prisma.$on('error', (e) => {
  logger.error('[Prisma] 執行錯誤：', e);
});

export { prisma };  

// Transection warpper
export const transaction = async (callback) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    try {
      const result = await callback(prisma);
      return result;
    } catch (error) {
      logger.error('[Prisma] 交易錯誤：', error);
      throw error;
    }
  });
  return transaction;
};