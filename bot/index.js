import { SlashHandler } from './handler/slashHandler.js';
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { loadLocale } from './utils/i18n.js';
import config from '../config.js';
import logger from '../logger.js';

const handler = new SlashHandler();
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
  handler.execute('ping').then(logger.info).catch(logger.error);
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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.once('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}`);
  await handler.syncCommands(client);
  if (process.env.CI) {
    logger.info('CI environment detected, shutting down.');
    await client.destroy();
    process.exit(0);
  }
});

client.commands = new Collection();

for (const slash of handler.slashCommands) {
  if (slash?.data?.name) {
    client.commands.set(slash.data.name, slash);
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
    logger.error(err);
    await interaction.reply({
      content: locale('error_execute'),
      ephemeral: true,
    });
  }
});

if (!config.discordToken) {
  logger.error('Discord token not provided in config or ENV');
  process.exit(1);
}
client.login(config.discordToken);
