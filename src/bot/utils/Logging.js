import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';

// 確保 logs 資料夾存在
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

export const logger = pino({
  level: 'debug', // 預設記錄等級，可改為 'info'
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      },
      {
        target: 'pino/file',
        options: {
          destination: 'logs/maiibot.log',
          mkdir: true
        }
      }
    ]
  }
});