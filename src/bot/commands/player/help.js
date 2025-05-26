import {SlashCommandBuilder} from 'discord.js';
import {replyUtils} from '../../utils/ReplyUtils.js';
import {logger} from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('顯示玩家指令幫助'),

    async execute(interaction) {
        try {
            // 建立幫助訊息欄位
            const fields = [
                {
                    name: '🚀 /player start',
                    value: '建立新角色並開始遊戲',
                    inline: false
                },
                {
                    name: '👤 /player profile [用戶]',
                    value: '查看自己或他人的角色資料',
                    inline: false
                },
                {
                    name: '🔒 /player privacy',
                    value: '設置個人資料隱私選項',
                    inline: false
                },
                {
                    name: '💸 /player transfer <用戶> <金額> [描述]',
                    value: '轉帳給其他玩家',
                    inline: false
                },
                {
                    name: '📊 /player balance',
                    value: '查看資金餘額和近期交易記錄',
                    inline: false
                }
            ];

            // 回覆幫助訊息
            await replyUtils.translate(interaction, 'player.help.title', {}, {
                title: '📖 玩家指令幫助',
                fields
            });
        } catch (error) {
            logger.error(`顯示幫助時出錯: ${error.message}`, error);
            await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
    }
};