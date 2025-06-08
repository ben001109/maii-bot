const fs = require('fs');
let config = { apiPort: 3000, discordToken: process.env.DISCORD_TOKEN };
if (fs.existsSync('./config.json')) {
  const file = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  config = { ...config, ...file };
}
module.exports = config;
