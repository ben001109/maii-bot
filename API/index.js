import express from 'express';
import config from '../config.js';
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Economy Game API' });
});

app.listen(config.apiPort, () => {
  console.log(`API server running on port ${config.apiPort}`);
});
