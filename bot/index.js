import { CommandHandler } from '../commandHandler.js';

const handler = new CommandHandler();
await handler.loadCommands(new URL('./commands/', import.meta.url));

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
setInterval(() => {
  console.log('Bot service running');
}, 60000);
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');
const { loadLocale } = require('./utils/i18n');
const config = require('../config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  const locale = loadLocale(interaction.locale);
  try {
    await command.execute(interaction, locale);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'Error executing command', ephemeral: true });
  }
});

if (!config.discordToken) {
  console.error('Discord token not provided in config or ENV');
  process.exit(1);
}
client.login(config.discordToken);
