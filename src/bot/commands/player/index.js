import {SlashCommandBuilder} from 'discord.js';
import {logger} from '../../utils/Logger.js';
import {replyUtils} from '../../utils/ReplyUtils.js';

// Import subcommands
import startCommand from './start.js';
import profileCommand from './profile.js';
import privacyCommand from './privacy.js';
import helpCommand from './help.js';
import transferCommand from './transfer.js';
import balanceCommand from './balance.js';

// Create a map of subcommands
const subcommands = {
    start: startCommand,
    profile: profileCommand,
    privacy: privacyCommand,
    help: helpCommand,
    transfer: transferCommand,
    balance: balanceCommand
};

export default {
    data: new SlashCommandBuilder()
        .setName('player')
        .setDescription('玩家相關指令')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('建立新角色並開始遊戲')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile')
                .setDescription('查看角色資料')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('指定要查看的用戶')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('privacy')
                .setDescription('設置個人資料隱私選項')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('顯示玩家指令幫助')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('轉帳給其他玩家')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('要轉帳的目標用戶')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('amount')
                        .setDescription('轉帳金額')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('交易描述')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('查看資金餘額和近期交易記錄')
        ),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            // Check if the subcommand exists
            if (subcommands[subcommand]) {
                // Execute the subcommand
                await subcommands[subcommand].execute(interaction);
            } else {
                await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
            }
        } catch (error) {
            logger.error(`執行玩家指令時出錯: ${error.message}`, error);
            await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
    }
};