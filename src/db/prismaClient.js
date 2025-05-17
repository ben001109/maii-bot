// 📁 src/db/prismaClient.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../bot/utils/Logging.js';

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