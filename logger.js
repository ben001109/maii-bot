import { createLogger, format, transports } from 'winston';
import fs from 'fs';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.simple()),
  transports: [
    new transports.File({ filename: `${logDir}/app.log` }),
    new transports.Console(),
  ],
});

export default logger;
