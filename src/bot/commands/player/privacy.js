import {ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder} from 'discord.js';
import {playerManager} from '../../utils/PlayerManager.js';
import {replyUtils} from '../../utils/ReplyUtils.js';
import {logger} from '../../utils/Logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('privacy')
        .setDescription('設置個人資料隱私選項'),

    async execute(interaction) {
        try {
            const {user} = interaction;

            // 檢查玩家是否已經初始化
            const isInitialized = await playerManager.isPlayerInitialized(user.id);

            if (!isInitialized) {
                return await replyUtils.translate(interaction, 'errors.notInitialized', {}, {type: 'error'});
            }

            // 獲取玩家資料
            const playerData = await playerManager.getPlayer(user.id, true);

            // 創建切換按鈕
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('privacy_public')
                        .setLabel('公開')
                        .setStyle(playerData.isProfilePublic ? ButtonStyle.Success : ButtonStyle.Secondary)
                        .setDisabled(playerData.isProfilePublic),
                    new ButtonBuilder()
                        .setCustomId('privacy_private')
                        .setLabel('私密')
                        .setStyle(!playerData.isProfilePublic ? ButtonStyle.Danger : ButtonStyle.Secondary)
                        .setDisabled(!playerData.isProfilePublic)
                );

            // 發送隱私設定訊息
            const reply = await replyUtils.translate(interaction, 'player.privacy.status', {
                status: playerData.isProfilePublic ? '公開' : '私密'
            }, {
                components: [row]
            });

            // 設置按鈕監聽器
            const filter = i => (i.customId === 'privacy_public' || i.customId === 'privacy_private') && i.user.id === user.id;
            const collector = reply.createMessageComponentCollector({filter, time: 60000, max: 1});

            collector.on('collect', async i => {
                // 更新隱私設定
                const isPublic = i.customId === 'privacy_public';
                await playerManager.setPlayerPrivacy(user.id, isPublic);

                // 更新按鈕
                const newRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('privacy_public')
                            .setLabel('公開')
                            .setStyle(isPublic ? ButtonStyle.Success : ButtonStyle.Secondary)
                            .setDisabled(isPublic),
                        new ButtonBuilder()
                            .setCustomId('privacy_private')
                            .setLabel('私密')
                            .setStyle(!isPublic ? ButtonStyle.Danger : ButtonStyle.Secondary)
                            .setDisabled(!isPublic)
                    );

                // 回覆更新訊息
                await i.update({
                    content: `隱私設定已更新為: ${isPublic ? '公開' : '私密'}`,
                    components: [newRow]
                });
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await interaction.editReply({components: []});
                }
            });
        } catch (error) {
            logger.error(`設置隱私選項時出錯: ${error.message}`, error);
            await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
    }
};