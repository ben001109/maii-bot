import fs from 'node:fs';
import path from 'node:path';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const materialsDir = path.join(__dirname, '../../data/materials');
const enterpriseMaterials = [];

for (const file of fs.readdirSync(materialsDir)) {
  if (file.endsWith('.json')) {
    const content = JSON.parse(fs.readFileSync(path.join(materialsDir, file), 'utf8'));
    enterpriseMaterials.push(...content);
  }
}

import { redis } from '../../../lib/redis.js';
import { logger } from '../../utils/Logging.js';

// 預留未來使用的 storage 結構邏輯，供企業/玩家倉儲擴展用途
const storage = {
  enterprises: {},
  players: {},
};

async function seedEnterpriseMaterials() {
  for (const mat of enterpriseMaterials) {
    const key = `material:${mat.id}`;
    await redis.set(key, JSON.stringify(mat));
    logger.info(`✅ 已寫入材料資料 ${mat.id}`);
  }
  logger.info(`✅ 共寫入 ${enterpriseMaterials.length} 筆企業材料資料`);
}

seedEnterpriseMaterials()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error('❌ 寫入材料資料時發生錯誤', err);
    process.exit(1);
  });
