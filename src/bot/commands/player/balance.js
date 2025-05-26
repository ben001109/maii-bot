import {SlashCommandBuilder} from 'discord.js';
import {playerManager} from '../../utils/PlayerManager.js';
import {replyUtils} from '../../utils/ReplyUtils.js';
import {logger} from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('查看資金餘額和近期交易記錄'),

    async execute(interaction) {
        try {
            const {user} = interaction;

            // 檢查玩家是否已經初始化
            const isInitialized = await playerManager.isPlayerInitialized(user.id);

            if (!isInitialized) {
                return await replyUtils.translate(interaction, 'errors.notInitialized', {}, {type: 'error'});
            }

            // 載入中提示
            await replyUtils.deferReply(interaction);

            // 獲取玩家資料
            const playerData = await playerManager.getPlayer(user.id, true);

            // 獲取近期交易記錄
            const transactions = await playerManager.getRecentTransactions(user.id, 5);

            // 建立餘額訊息欄位
            const fields = [
                {
                    name: '💰 當前餘額',
                    value: `$${playerManager.formatMoney(playerData.money)}`,
                    inline: false
                }
            ];

            // 添加交易記錄
            if (transactions.length > 0) {
                const transactionList = transactions.map(t => {
                    const amount = t.amount;
                    const isIncome = amount > 0;
                    const formattedAmount = `${isIncome ? '+' : ''}$${playerManager.formatMoney(amount)}`;
                    const date = new Date(t.timestamp).toLocaleString();
                    return `${date} | ${formattedAmount} | ${t.description}`;
                }).join('\n');

                fields.push({
                    name: '📝 近期交易記錄',
                    value: `\`\`\`\n${transactionList}\n\`\`\``,
                    inline: false
                });
            } else {
                fields.push({
                    name: '📝 近期交易記錄',
                    value: '暫無交易記錄',
                    inline: false
                });
            }

            // 回覆餘額訊息
            await replyUtils.translate(interaction, 'player.balance.title', {}, {
                title: '💰 資金餘額',
                fields
            });
        } catch (error) {
            logger.error(`查看餘額時出錯: ${error.message}`, error);
            await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
    }
};