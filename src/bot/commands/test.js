// 📁 src/bot/commands/admin/remove.js
import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/Logging.js';
import { EmbedBuilder } from 'discord.js';
import { getEphemeralForPlayer } from '../utils/replyWithPrivacy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('測試指令')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ping')
        .setDescription('延遲測試')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('say')
        .setDescription('發送訊息')
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
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('embed')
        .setDescription('顯示一個範例 Embed')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'ping') {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#00ff99')
            .setTitle('🏓 Pong! 延遲測試成功。')
            .addFields(
              { name: '用戶名稱', value: interaction.user.tag, inline: true },
              { name: '用戶 ID', value: interaction.user.id, inline: true },
              { name: '伺服器名稱', value: interaction.guild?.name ?? '未知', inline: true },
              { name: '伺服器 ID', value: interaction.guild?.id ?? '未知', inline: true },
              { name: 'API 延遲', value: `${interaction.client.ws.ping}ms`, inline: true },
              { name: '執行時間', value: new Date().toLocaleString(), inline: false },
            )
            .setTimestamp(),
        ],
        ephemeral: true,
      });
      logger.debug(
        `Test command 'ping' executed by ${interaction.user.tag} (${interaction.user.id})`
      );
      return;
    }
    if (sub === 'say') {
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
        `Test command 'say' executed by ${interaction.user.tag} (${interaction.user.id}) with message: ${message}`
      );
      return;
    }
    if (sub === 'embed') {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#9966ff')
            .setTitle('🧪 測試 Embed')
            .setDescription('這是一個範例 Embed 測試訊息。')
            .addFields(
              { name: '用戶名稱', value: interaction.user.tag, inline: true },
              { name: '用戶 ID', value: interaction.user.id, inline: true },
              { name: '伺服器名稱', value: interaction.guild?.name ?? '未知', inline: true },
              { name: '伺服器 ID', value: interaction.guild?.id ?? '未知', inline: true },
              { name: 'API 延遲', value: `${interaction.client.ws.ping}ms`, inline: true },
              { name: '執行時間', value: new Date().toLocaleString(), inline: false },
            )
            .setTimestamp()
        ],
        ephemeral: true
      });
      logger.debug(
        `Test command 'embed' executed by ${interaction.user.tag} (${interaction.user.id})`
      );
      return;
    }
  },
};

/* 這裡的 logger 是從 utils/Logging.js 中引入的
* logger 是用來記錄日誌的工具
* 測試要有詳細記錄
* 所以要在後面加上logger.debug的詳細記錄
*/