// 📁 src/bot/commands/admin/remove.js
import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/Logging.js';
import { EmbedBuilder } from 'discord.js';
import { getEphemeralForPlayer } from '../utils/replyWithPrivacy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('測試指令')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('要發送的訊息')
        .setRequired(true),
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('要發送的使用者')
        .setRequired(false),
    ),
  async execute(interaction) {
    const message = interaction.options.getString('message');
    const user = interaction.options.getUser('user') || interaction.user;

    await interaction.reply(
      getEphemeralForPlayer(interaction.user, {
        embeds: [
          new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('測試指令')
            .setDescription(message)
            .setFooter({
              text: `由 ${interaction.user.tag} (${interaction.user.id}) 發送`,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
      })
    );

    logger.debug(
      `Test command executed by ${interaction.user.tag} (${interaction.user.id}) with message: ${message}`
    );
  },
};
/* 這裡的 logger 是從 utils/Logging.js 中引入的
* logger 是用來記錄日誌的工具
* 測試要有詳細記錄
* 所以要在後面加上logger.debug的詳細記錄
*/