import { getEphemeralForPlayer } from './replyWithPrivacy.js';

// i18n 支援: 格式化訊息內容，可對接 i18n 套件
export function formatMessage(message) {
  // 若是字串則直接傳回；若是 key 則可替換成 i18n 函式如 i18n.t(key)
  // 目前暫為簡易實作，保留擴充點
  return typeof message === 'string' ? message : String(message);
}

import { EmbedBuilder } from 'discord.js';
// 這裡的 EmbedBuilder 是從 discord.js 套件中引入的
// EmbedBuilder 是用來建立 Discord 的嵌入式訊息
// 這裡的 EmbedBuilder 是用來建立 Discord 的嵌入式訊息
export async function sendSuccess(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`✅ ${formatMessage(message)}`)
    .setColor(0x57F287); // Discord 綠色

  return interaction.reply({
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer),
  });
}

export async function defer(interaction, ephemeral = true) {
  if (interaction.deferred || interaction.replied) return;
  return interaction.deferReply({ ephemeral });
}
export async function sendWarning(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`⚠️ ${formatMessage(message)}`)
    .setColor(0xFAA61A); // Discord 黃色
// src/bot/utils/ReplyUtils.js

  import {EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
  import {logger} from './Logger.js';
  import {getTranslation} from './i18n/TranslationManager.js';

  /**
   * 統一回覆工具類
   */
  class ReplyUtils {
    /**
     * 發送成功訊息
     * @param {Object} interaction - Discord 互動物件
     * @param {String} message - 訊息內容
     * @param {Object} options - 其他選項
     * @returns {Promise<Object>} 互動回覆
     */
    async success(interaction, message, options = {}) {
      const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`✅ ${message}`)
          .setTimestamp();

      if (options.title) {
        embed.setTitle(options.title);
      }

      if (options.fields) {
        embed.addFields(options.fields);
      }

      if (options.ephemeral === undefined) {
        options.ephemeral = false;
      }

      try {
        if (interaction.deferred || interaction.replied) {
          return await interaction.editReply({embeds: [embed], components: options.components || []});
        } else {
          return await interaction.reply({
            embeds: [embed],
            ephemeral: options.ephemeral,
            components: options.components || []
          });
        }
      } catch (error) {
        logger.error('發送成功訊息時出錯:', error);
        throw error;
      }
    }

    /**
     * 發送錯誤訊息
     * @param {Object} interaction - Discord 互動物件
     * @param {String} message - 訊息內容
     * @param {Object} options - 其他選項
     * @returns {Promise<Object>} 互動回覆
     */
    async error(interaction, message, options = {}) {
      const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription(`❌ ${message}`)
          .setTimestamp();

      if (options.title) {
        embed.setTitle(options.title);
      }

      if (options.fields) {
        embed.addFields(options.fields);
      }

      if (options.ephemeral === undefined) {
        options.ephemeral = true;
      }

      try {
        if (interaction.deferred || interaction.replied) {
          return await interaction.editReply({embeds: [embed]});
        } else {
          return await interaction.reply({embeds: [embed], ephemeral: options.ephemeral});
        }
      } catch (error) {
        logger.error('發送錯誤訊息時出錯:', error);
        try {
          await interaction.channel.send({embeds: [embed]});
        } catch (secondError) {
          logger.error('嘗試通過頻道發送訊息時出錯:', secondError);
        }
      }
    }

    /**
     * 發送警告訊息
     * @param {Object} interaction - Discord 互動物件
     * @param {String} message - 訊息內容
     * @param {Object} options - 其他選項
     * @returns {Promise<Object>} 互動回覆
     */
    async warning(interaction, message, options = {}) {
      const embed = new EmbedBuilder()
          .setColor(Colors.Yellow)
          .setDescription(`⚠️ ${message}`)
          .setTimestamp();

      if (options.title) {
        embed.setTitle(options.title);
      }

      if (options.fields) {
        embed.addFields(options.fields);
      }

      if (options.ephemeral === undefined) {
        options.ephemeral = true;
      }

      try {
        if (interaction.deferred || interaction.replied) {
          return await interaction.editReply({embeds: [embed], components: options.components || []});
        } else {
          return await interaction.reply({
            embeds: [embed],
            ephemeral: options.ephemeral,
            components: options.components || []
          });
        }
      } catch (error) {
        logger.error('發送警告訊息時出錯:', error);
        throw error;
      }
    }

    /**
     * 發送資訊訊息
     * @param {Object} interaction - Discord 互動物件
     * @param {String} message - 訊息內容
     * @param {Object} options - 其他選項
     * @returns {Promise<Object>} 互動回覆
     */
    async info(interaction, message, options = {}) {
      const embed = new EmbedBuilder()
          .setColor(Colors.Blue)
          .setDescription(message)
          .setTimestamp();

      if (options.title) {
        embed.setTitle(options.title);
      }

      if (options.fields) {
        embed.addFields(options.fields);
      }

      if (options.ephemeral === undefined) {
        options.ephemeral = false;
      }

      try {
        if (interaction.deferred || interaction.replied) {
          return await interaction.editReply({embeds: [embed], components: options.components || []});
        } else {
          return await interaction.reply({
            embeds: [embed],
            ephemeral: options.ephemeral,
            components: options.components || []
          });
        }
      } catch (error) {
        logger.error('發送資訊訊息時出錯:', error);
        throw error;
      }
    }

    /**
     * 發送需要確認的訊息
     * @param {Object} interaction - Discord 互動物件
     * @param {String} message - 訊息內容
     * @param {Function} confirmCallback - 確認後的回調函數
     * @param {Function} cancelCallback - 取消後的回調函數
     * @param {Object} options - 其他選項
     * @returns {Promise<Object>} 互動回覆
     */
    async confirm(interaction, message, confirmCallback, cancelCallback, options = {}) {
      const embed = new EmbedBuilder()
          .setColor(Colors.Orange)
          .setDescription(`⚠️ ${message}`)
          .setTimestamp();

      if (options.title) {
        embed.setTitle(options.title);
      }

      if (options.fields) {
        embed.addFields(options.fields);
      }

      const confirmId = `confirm_${Date.now()}`;
      const cancelId = `cancel_${Date.now()}`;

      const row = new ActionRowBuilder()
          .addComponents(
              new ButtonBuilder()
                  .setCustomId(confirmId)
                  .setLabel('確認')
                  .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                  .setCustomId(cancelId)
                  .setLabel('取消')
                  .setStyle(ButtonStyle.Secondary)
          );

      const reply = await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: options.ephemeral || true,
        fetchReply: true
      });

      try {
        const filter = i => (i.customId === confirmId || i.customId === cancelId) && i.user.id === interaction.user.id;
        const collector = reply.createMessageComponentCollector({filter, time: 30000, max: 1});

        collector.on('collect', async i => {
          if (i.customId === confirmId) {
            await confirmCallback(i);
          } else {
            await cancelCallback(i);
          }
        });

        collector.on('end', async collected => {
          if (collected.size === 0) {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                    .setColor(Colors.Grey)
                    .setDescription('⏱️ 操作已逾時')
              ],
              components: []
            });
          }
        });

        return reply;
      } catch (error) {
        logger.error('確認訊息處理時出錯:', error);
        throw error;
      }
    }

    /**
     * 用於顯示玩家資料的 Embed
     * @param {Object} user - Discord 使用者
     * @param {Object} playerData - 玩家資料
     * @param {Object} options - 其他選項
     * @returns {EmbedBuilder} 嵌入訊息建構器
     */
    createPlayerEmbed(user, playerData, options = {}) {
      const embed = new EmbedBuilder()
          .setColor(Colors.Blue)
          .setTitle(`${user.username} 的個人資料`)
          .setThumbnail(user.displayAvatarURL())
          .setTimestamp();

      // 格式化金額
      const formatMoney = (amount) => {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      // 添加基本資訊
      const fields = [
        {
          name: '💰 資金',
          value: `$${formatMoney(playerData.money)}`,
          inline: true
        },
        {
          name: '💼 企業數量',
          value: `${playerData.enterpriseCount || 0}`,
          inline: true
        },
        {
          name: '🕒 遊戲時間',
          value: `${playerData.gameTime} 小時`,
          inline: true
        }
      ];

      // 如果有職業欄位就顯示
      if (playerData.occupation) {
        fields.push({
          name: '👨‍💼 職業',
          value: playerData.occupation,
          inline: true
        });
      }

      // 添加成就欄位
      if (playerData.achievements && playerData.achievements.length > 0) {
        fields.push({
          name: '🏆 成就',
          value: playerData.achievements.join(', '),
          inline: false
        });
      }

      // 添加自訂欄位
      if (options.additionalFields) {
        fields.push(...options.additionalFields);
      }

      embed.addFields(fields);

      return embed;
    }

    /**
     * 創建分頁控制器
     * @param {Object} interaction - Discord 互動物件
     * @param {Array} pages - 頁面數組
     * @param {Object} options - 其他選項
     * @returns {Promise<Object>} 互動回覆
     */
    async createPagination(interaction, pages, options = {}) {
      if (pages.length === 0) {
        return await this.info(interaction, '沒有資料可顯示');
      }

      let currentPage = 0;

      const getRow = (disabled = false) => {
        const row = new ActionRowBuilder();

        if (pages.length > 1) {
          row.addComponents(
              new ButtonBuilder()
                  .setCustomId('first')
                  .setLabel('⏮️')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(disabled || currentPage === 0),
              new ButtonBuilder()
                  .setCustomId('prev')
                  .setLabel('◀️')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(disabled || currentPage === 0),
              new ButtonBuilder()
                  .setCustomId('next')
                  .setLabel('▶️')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(disabled || currentPage === pages.length - 1),
              new ButtonBuilder()
                  .setCustomId('last')
                  .setLabel('⏭️')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(disabled || currentPage === pages.length - 1)
          );
        }

        return row;
      };

      // 發送初始頁面
      const reply = await interaction.reply({
        embeds: [pages[currentPage].setFooter({text: `頁面 ${currentPage + 1}/${pages.length}`})],
        components: [getRow()],
        ephemeral: options.ephemeral || false,
        fetchReply: true
      });

      // 如果只有一頁，不需要設置收集器
      if (pages.length === 1) return;

      // 設置收集器
      const filter = i => ['first', 'prev', 'next', 'last'].includes(i.customId) && i.user.id === interaction.user.id;
      const collector = reply.createMessageComponentCollector({filter, time: 300000});

      collector.on('collect', async i => {
        switch (i.customId) {
          case 'first':
            currentPage = 0;
            break;
          case 'prev':
            currentPage = Math.max(0, currentPage - 1);
            break;
          case 'next':
            currentPage = Math.min(pages.length - 1, currentPage + 1);
            break;
          case 'last':
            currentPage = pages.length - 1;
            break;
        }

        await i.update({
          embeds: [pages[currentPage].setFooter({text: `頁面 ${currentPage + 1}/${pages.length}`})],
          components: [getRow()]
        });
      });

      collector.on('end', async () => {
        try {
          await interaction.editReply({
            components: [getRow(true)]
          });
        } catch (error) {
          logger.error('分頁控制器結束時出錯:', error);
        }
      });

      return reply;
    }

    /**
     * 處理載入中狀態
     * @param {Object} interaction - Discord 互動物件
     * @param {String} message - 載入訊息
     * @param {Boolean} ephemeral - 是否為臨時訊息
     * @returns {Promise<void>}
     */
    async deferReply(interaction, message = '處理中...', ephemeral = false) {
      try {
        await interaction.deferReply({ephemeral});
      } catch (error) {
        logger.error('延遲回覆時出錯:', error);
        throw error;
      }
    }

    /**
     * 翻譯並發送訊息
     * @param {Object} interaction - Discord 互動物件
     * @param {String} key - 翻譯鍵值
     * @param {Object} params - 替換參數
     * @param {Object} options - 其他選項
     * @returns {Promise<Object>} 互動回覆
     */
    async translate(interaction, key, params = {}, options = {}) {
      const locale = interaction.locale || 'zh-TW';
      const message = getTranslation(key, locale, params);

      switch (options.type) {
        case 'error':
          return await this.error(interaction, message, options);
        case 'warning':
          return await this.warning(interaction, message, options);
        case 'success':
          return await this.success(interaction, message, options);
        default:
          return await this.info(interaction, message, options);
      }
    }
  }

  export const replyUtils = new ReplyUtils();
  return interaction.reply({
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer),
  });
}

export async function sendError(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`❌ ${formatMessage(message)}`)
    .setColor(0xED4245); // Discord 紅色

  return interaction.reply({
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer),
  });
}

export const replySuccess = sendSuccess;
export const replyFail = sendError;

// 管理員專用訊息，強制 ephemeral: true
export async function sendAdminMessage(interaction, message) {
  const embed = new EmbedBuilder()
    .setDescription(`🛠️ ${formatMessage(message)}`)
    .setColor(0x3498DB); // 藍色
  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

export async function sendSyncResult(interaction, summaryLines) {
  return interaction.editReply({
    content: summaryLines.join('\n')
  });
}
// 回覆工具：reset 結果通用訊息
export async function sendResetResult(interaction, message, userOrPlayer = true) {
  const embed = new EmbedBuilder()
    .setDescription(`♻️ ${formatMessage(message)}`)
    .setColor(0x7289DA); // Discord blurple

  const response = {
    embeds: [embed],
    ephemeral: getEphemeralForPlayer(userOrPlayer)
  };

  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(response);
  }
    return interaction.reply(response);
}