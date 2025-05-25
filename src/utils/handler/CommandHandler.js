// src/utils/handler/CommandHandler.js

import {Collection} from 'discord.js';
import {promises as fs} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {logger} from '../Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Command categories and their directories
const COMMAND_CATEGORIES = [
    'player',
    'enterprise',
    'admin',
    'utility',
];

/**
 * Recursively loads command files from a directory
 * @param {string} directory - The directory to scan for command files
 * @param {Collection} commandsCollection - Collection to store commands
 * @returns {Promise<Collection>} Collection of loaded commands
 */
async function loadCommandsFromDirectory(directory, commandsCollection) {
    try {
        const items = await fs.readdir(directory, {withFileTypes: true});

        for (const item of items) {
            const itemPath = join(directory, item.name);

            if (item.isDirectory()) {
                // Recursively process subdirectories
                await loadCommandsFromDirectory(itemPath, commandsCollection);
            } else if (item.name.endsWith('.js')) {
                try {
                    // Import the command module
                    const {default: command} = await import(`file://${itemPath}`);

                    // Skip files that don't export a valid command
                    if (!command || !command.data || !command.execute) {
                        logger.warn(`Invalid command module: ${itemPath}`);
                        continue;
                    }

                    // Add command to collection
                    commandsCollection.set(command.data.name, command);
                    logger.debug(`Loaded command: ${command.data.name}`);
                } catch (error) {
                    logger.error(`Failed to load command from ${itemPath}:`, error);
                }
            }
        }

        return commandsCollection;
    } catch (error) {
        logger.error(`Error loading commands from ${directory}:`, error);
        return commandsCollection;
    }
}

/**
 * Loads all slash commands and registers them with the Discord client
 * @param {import('discord.js').Client} client - Discord.js client instance
 * @returns {Promise<Collection>} Collection of loaded commands
 */
export async function loadSlashCommands(client) {
    const commandsPath = join(__dirname, '../../commands');
    const commands = new Collection();

    try {
        // Load commands from each category directory
        for (const category of COMMAND_CATEGORIES) {
            const categoryPath = join(commandsPath, category);

            try {
                // Check if directory exists before attempting to read
                await fs.access(categoryPath);
                await loadCommandsFromDirectory(categoryPath, commands);
            } catch (error) {
                // Skip if directory doesn't exist
                if (error.code === 'ENOENT') {
                    logger.debug(`Command category directory not found: ${category}`);
                } else {
                    logger.error(`Error accessing command category ${category}:`, error);
                }
            }
        }

        // Store commands in client for easy access
        client.commands = commands;

        logger.info(`Loaded ${commands.size} commands successfully`);
        return commands;
    } catch (error) {
        logger.error('Failed to load slash commands:', error);
        throw error;
    }
}

/**
 * Reloads a specific command, useful for development
 * @param {import('discord.js').Client} client - Discord.js client instance
 * @param {string} commandName - Name of command to reload
 * @returns {Promise<boolean>} Success status
 */
export async function reloadCommand(client, commandName) {
    try {
        const command = client.commands.get(commandName);
        if (!command) {
            logger.warn(`Command not found for reload: ${commandName}`);
            return false;
        }

        // Get command path from its module
        const commandPath = command.filePath;

        // Remove command from cache and collection
        delete require.cache[require.resolve(commandPath)];
        client.commands.delete(commandName);

        // Reload the command
        const {default: newCommand} = await import(`file://${commandPath}?update=${Date.now()}`);
        client.commands.set(newCommand.data.name, newCommand);

        logger.info(`Reloaded command: ${commandName}`);
        return true;
    } catch (error) {
        logger.error(`Failed to reload command ${commandName}:`, error);
        return false;
    }
}

export default {loadSlashCommands, reloadCommand};
