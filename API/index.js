import express from 'express';
import config from '../config.js';
import logger from '../logger.js';
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Economy Game API' });
});

app.listen(config.apiPort, () => {
  logger.info(`API server running on port ${config.apiPort}`);
});
