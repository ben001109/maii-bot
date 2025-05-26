import {SlashCommandBuilder} from 'discord.js';
import {playerManager} from '../../utils/PlayerManager.js';
import {replyUtils} from '../../utils/ReplyUtils.js';
import {logger} from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
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
        ),

    async execute(interaction) {
        try {
            const {options, user} = interaction;

            // 獲取參數
            const targetUser = options.getUser('user');
            const amount = options.getInteger('amount');
            const description = options.getString('description') || '轉帳';

            // 基本檢查
            if (targetUser.id === user.id) {
                return await replyUtils.translate(interaction, 'errors.invalidInput', {}, {type: 'error'});
            }

            if (amount <= 0) {
                return await replyUtils.translate(interaction, 'errors.invalidInput', {}, {type: 'error'});
            }

            // 檢查玩家是否已經初始化
            const isInitialized = await playerManager.isPlayerInitialized(user.id);

            if (!isInitialized) {
                return await replyUtils.translate(interaction, 'errors.notInitialized', {}, {type: 'error'});
            }

            // 檢查目標玩家是否已經初始化
            const isTargetInitialized = await playerManager.isPlayerInitialized(targetUser.id);

            if (!isTargetInitialized) {
                return await replyUtils.translate(interaction, 'errors.notFound', {}, {type: 'error'});
            }

            // 載入中提示
            await replyUtils.deferReply(interaction);

            // 檢查餘額是否足夠
            const canAfford = await playerManager.canPlayerAfford(user.id, amount);

            if (!canAfford) {
                return await replyUtils.translate(interaction, 'errors.notEnoughMoney', {}, {type: 'error'});
            }

            // 執行轉帳
            const result = await playerManager.transferMoney(user.id, targetUser.id, amount, description);

            // 回覆成功訊息
            await replyUtils.success(interaction, `成功轉帳 $${playerManager.formatMoney(amount)} 給 ${targetUser.username}！`, {
                fields: [
                    {
                        name: '💸 交易金額',
                        value: `$${playerManager.formatMoney(amount)}`,
                        inline: true
                    },
                    {
                        name: '📝 交易描述',
                        value: description,
                        inline: true
                    }
                ]
            });

            logger.info(`玩家 ${user.tag} (${user.id}) 轉帳 $${amount} 給 ${targetUser.tag} (${targetUser.id})`);
        } catch (error) {
            logger.error(`轉帳時出錯: ${error.message}`, error);
            await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
    }
};