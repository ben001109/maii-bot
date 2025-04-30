import { Client, GatewayIntentBits } from 'discord.js';
import { loadSlashCommands } from './utils/SlashHandler.js';
// Import the ready event handler to set up the bot's ready state
import './events/ready.js';
// import './events/non_command.js';
import './commands/enterprise/create.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../config/config.json');
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`✅ Bot 上線囉！登入為 ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (command) {
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '執行指令時發生錯誤', ephemeral: true });
    }
  }
});

// export default {
//   client:client
// };

// 初始化指令
client.commands = new Map();
await loadSlashCommands(client);

// 登入 Discord
client.login(config.discordToken);
// Discord bot launcher
