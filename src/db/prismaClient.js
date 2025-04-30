import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
// 這樣做是為了避免在開發模式下多次連接 Prisma，導致連接數過多的問題
// 這樣的寫法在開發模式下會使用全域變數來儲存 PrismaClient 實例，
// 這樣就不會每次都創建新的 PrismaClient 實例了
// 這樣做的好處是可以避免在開發模式下多次連接 Prisma，
// 導致連接數過多的問題
