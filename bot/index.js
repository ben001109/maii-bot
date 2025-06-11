import { CommandHandler } from '../commandHandler.js';
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import { loadLocale } from './utils/i18n.js';
import config from '../config.js';
import logger from '../logger.js';

const handler = new CommandHandler();
await handler.loadCommands(new URL('./commands/', import.meta.url));

handler.on('synced', () => {
  logger.info('Slash commands synced');
});

export async function runCommand(name, ...args) {
  return handler.execute(name, ...args);
}

// Example usage if this file is run directly
if (
  import.meta.url === process.argv[1] ||
  import.meta.url === `file://${process.argv[1]}`
) {
  handler.execute('ping').then(console.log).catch(console.error);
}

const originalFetch = global.fetch;
global.fetch = async (...args) => {
  const response = await originalFetch(...args);
  try {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const method = args[1]?.method || args[0]?.method || 'GET';
    if (url && /discord(app)?\.com/.test(url)) {
      logger.info(`Discord API ${method} ${url} -> ${response.status}`);
    }
  } catch (err) {
    logger.error(`Failed to log Discord API response: ${err}`);
  }
  return response;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.once('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}`);
  await handler.syncCommands(client);
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath)) {
  const command = await import(path.join(commandsPath, file));
  const cmd = command.slashCommand || command.default || command;
  if (cmd?.data?.name) {
    client.commands.set(cmd.data.name, cmd);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  const locale = loadLocale(interaction.locale);
  try {
    await command.execute(interaction, locale);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: 'Error executing command',
      ephemeral: true,
    });
  }
});

if (!config.discordToken) {
  console.error('Discord token not provided in config or ENV');
  process.exit(1);
}
client.login(config.discordToken);
