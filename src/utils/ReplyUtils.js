// src/utils/ReplyUtils.js

import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import {logger} from './Logger.js';

/**
 * Standard colors for different message types
 */
const COLORS = {
    SUCCESS: 0x00FF00,  // Green
    ERROR: 0xFF0000,    // Red
    WARNING: 0xFFAA00,  // Orange
    INFO: 0x0099FF,     // Blue
    NEUTRAL: 0x888888,  // Gray
};

/**
 * Reply utilities for consistent interaction responses
 */
export const ReplyUtils = {
    /**
     * Send a success message
     * @param {import('discord.js').CommandInteraction} interaction - Discord interaction
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     * @returns {Promise<import('discord.js').Message>} Sent message
     */
    async success(interaction, message, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle(options.title || '✅ Success')
            .setDescription(message)
            .setTimestamp();

        if (options.fields) {
            embed.addFields(options.fields);
        }

        return this._reply(interaction, {embeds: [embed], ephemeral: options.ephemeral});
    },

    /**
     * Send an error message
     * @param {import('discord.js').CommandInteraction} interaction - Discord interaction
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {Promise<import('discord.js').Message>} Sent message
     */
    async error(interaction, message, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setTitle(options.title || '❌ Error')
            .setDescription(message)
            .setTimestamp();

        // Log the error
        logger.error(`UI Error: ${message}`, {
            command: interaction.commandName,
            userId: interaction.user.id,
            error: options.error
        });

        return this._reply(interaction, {
            embeds: [embed],
            ephemeral: options.ephemeral !== false // Default to true for errors
        });
    },

    /**
     * Send a warning message
     * @param {import('discord.js').CommandInteraction} interaction - Discord interaction
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {Promise<import('discord.js').Message>} Sent message
     */
    async warning(interaction, message, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle(options.title || '⚠️ Warning')
            .setDescription(message)
            .setTimestamp();

        return this._reply(interaction, {embeds: [embed], ephemeral: options.ephemeral});
    },

    /**
     * Send an info message
     * @param {import('discord.js').CommandInteraction} interaction - Discord interaction
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {Promise<import('discord.js').Message>} Sent message
     */
    async info(interaction, message, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle(options.title || 'ℹ️ Information')
            .setDescription(message)
            .setTimestamp();

        if (options.fields) {
            embed.addFields(options.fields);
        }

        if (options.footer) {
            embed.setFooter({text: options.footer});
        }

        return this._reply(interaction, {embeds: [embed], ephemeral: options.ephemeral});
    },

    /**
     * Create a custom embed with predefined styling
     * @param {Object} options - Embed options
     * @returns {EmbedBuilder} Configured embed
     */
    createEmbed(options = {}) {
        const color = options.color ? options.color :
            (COLORS[options.type?.toUpperCase()] || COLORS.NEUTRAL);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTimestamp();

        if (options.title) embed.setTitle(options.title);
        if (options.description) embed.setDescription(options.description);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.author) embed.setAuthor(options.author);
        if (options.footer) embed.setFooter({text: options.footer});
        if (options.fields) embed.addFields(options.fields);

        return embed;
    },

    /**
     * Create a confirmation message with Yes/No buttons
     * @param {import('discord.js').CommandInteraction} interaction - Discord interaction
     * @param {string} message - Confirmation message
     * @param {Object} options - Additional options
     * @returns {Promise<import('discord.js').Message>} Sent message
     */
    async confirm(interaction, message, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.WARNING)
            .setTitle(options.title || '🔔 Confirmation')
            .setDescription(message)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_yes')
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('confirm_no')
                    .setLabel('No')
                    .setStyle(ButtonStyle.Danger)
            );

        return this._reply(interaction, {
            embeds: [embed],
            components: [row],
            ephemeral: options.ephemeral !== false // Default to true for confirmations
        });
    },

    /**
     * Handle interaction replies, whether deferred or not
     * @private
     * @param {import('discord.js').CommandInteraction} interaction - Discord interaction
     * @param {Object} options - Reply options
     * @returns {Promise<import('discord.js').Message>} Sent message
     */
    async _reply(interaction, options) {
        try {
            // If interaction has been deferred, use editReply
            if (interaction.deferred) {
                return await interaction.editReply(options);
            }

            // If interaction has been replied to, use followUp
            if (interaction.replied) {
                return await interaction.followUp(options);
            }

            // Otherwise, use reply
            return await interaction.reply(options);
        } catch (error) {
            logger.error('Error sending reply:', error);

            // Try to send a simple reply if the rich embed fails
            try {
                const content = options.embeds?.[0]?.description || 'An error occurred';
                return await interaction.reply({
                    content,
                    ephemeral: true
                });
            } catch (fallbackError) {
                logger.error('Failed to send fallback reply:', fallbackError);
                throw error; // Re-throw the original error
            }
        }
    }
};

export default ReplyUtils;
