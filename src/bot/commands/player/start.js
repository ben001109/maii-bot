import {SlashCommandBuilder} from 'discord.js';
import {playerManager} from '../../utils/PlayerManager.js';
import {replyUtils} from '../../utils/ReplyUtils.js';
import {logger} from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('建立新角色並開始遊戲'),

    async execute(interaction) {
        try {
            const {user} = interaction;

            // 檢查玩家是否已經初始化
            const isInitialized = await playerManager.isPlayerInitialized(user.id);

            if (isInitialized) {
                return await replyUtils.translate(interaction, 'player.start.alreadyRegistered', {}, {type: 'warning'});
            }

            // 初始化玩家
            const initialMoney = 10000;
            const player = await playerManager.initializePlayer(user.id, user.username, {
                initialMoney,
                occupation: '平民'
            });

            // 建立成功訊息欄位
            const fields = [
                {
                    name: '💰 初始資金',
                    value: `$${playerManager.formatMoney(initialMoney)}`,
                    inline: true
                },
                {
                    name: '🆕 帳號狀態',
                    value: '新帳號',
                    inline: true
                },
                {
                    name: '👨‍💼 職業',
                    value: player.occupation || '平民',
                    inline: true
                }
            ];

            // 回覆成功訊息
            await replyUtils.translate(interaction, 'player.start.success', {}, {
                type: 'success',
                fields
            });

            logger.info(`玩家 ${user.tag} (${user.id}) 成功建立角色`);
        } catch (error) {
            logger.error(`建立角色時出錯: ${error.message}`, error);
            await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
    }
};