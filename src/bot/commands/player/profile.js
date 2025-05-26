import {SlashCommandBuilder} from 'discord.js';
import {playerManager} from '../../utils/PlayerManager.js';
import {replyUtils} from '../../utils/ReplyUtils.js';
import {logger} from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('查看角色資料')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('指定要查看的用戶')
                .setRequired(false)
        ),

    async execute(interaction) {
        try {
            const {options, user} = interaction;

            // 獲取目標用戶（如果有指定）
            const targetUser = options.getUser('user') || user;
            const isSelf = targetUser.id === user.id;

            // 載入中提示
            await replyUtils.deferReply(interaction);

            // 獲取玩家資料
            const playerData = await playerManager.getPlayer(targetUser.id, isSelf);

            // 檢查玩家是否存在
            if (!playerData || !playerData.initialized) {
                return await replyUtils.translate(interaction, 'player.profile.notInitialized', {}, {type: 'warning'});
            }

            // 檢查隱私設定
            if (!isSelf && !playerData.isProfilePublic) {
                return await replyUtils.translate(interaction, 'player.profile.privateProfile', {}, {type: 'warning'});
            }

            // 創建玩家資料嵌入
            const embed = replyUtils.createPlayerEmbed(targetUser, playerData);

            // 回覆
            await interaction.editReply({embeds: [embed]});
        } catch (error) {
            logger.error(`查看玩家資料時出錯: ${error.message}`, error);
            await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
    }
};