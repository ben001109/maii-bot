// 📁 src/db/prismaClient.js

import { PrismaClient } from '@prisma/client';

const IS_DEV = process.env.NODE_ENV !== 'production';

// 避免在開發模式下 PrismaClient 被多次實例化
const globalRef = globalThis;

let prisma;

if (IS_DEV) {
  if (!globalRef._prisma) {
    globalRef._prisma = new PrismaClient();
  }
  prisma = globalRef._prisma;
} else {
  prisma = new PrismaClient();
}

export { prisma };