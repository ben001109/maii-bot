import { MessageFlags, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
	getOrCreatePlayer,
	getPlayer,
	updatePlayer,
  initializePlayer,
} from "../../services/playerService.js";
import { getEnterprisesByPlayer } from "../../services/enterpriseService.js";
import { logger } from "../utils/Logging.js";
import { getEphemeralForPlayer} from "../utils/replyWithPrivacy.js";
import { COOLDOWN_LABELS } from "../utils/formatter.js";

const VALID_KEYS = {
	replyVisibility: ["private", "public"],
	searchable: ["true", "false"],
	"profileVisibility.money": ["true", "false"],
	"profileVisibility.enterprises": ["true", "false"],
};

function formatPlayerProfile(
	user,
	player,
	enterprises,
	privacy,
	isSelf = true,
) {
	let content = `👤 玩家：<@${user.id}>\n`;

	const showMoney = isSelf || privacy.profileVisibility?.money !== false;
	const showEnterprises =
		isSelf || privacy.profileVisibility?.enterprises !== false;

	if (showMoney) {
		const funds = player.money?.toLocaleString() ?? 0;
		content += `💰 資金：$${funds}\n`;
	} else {
		content += "💰 資金：已隱藏\n";
	}

	if (showEnterprises) {
		if (enterprises.length > 0) {
			content += `\n🏢 擁有企業 (${enterprises.length}):\n`;
			content += enterprises
				.map(
					(e, i) =>
						`  ${i + 1}. **${e.name}** (${e.type}) Lv.${e.level}｜收入：$${e.income}/hr`,
				)
				.join("\n");
		} else {
			content += "\n🏢 尚未擁有任何企業";
		}
	} else {
		content += "\n🏢 企業資訊：已隱藏";
	}

  if (isSelf && player.enterpriseCreated !== undefined) {
    content += `\n🔁 創業次數：${player.enterpriseCreated}`;
  }

	if (!isSelf && (!showMoney || !showEnterprises)) {
		content += "\n\n🔒 對方部分資料已設為私人，只有本人能看到完整訊息。";
	}

	// 冷卻資訊顯示
	if (isSelf && player.cooldowns) {
		const now = new Date(player.time);
		const cooldowns = player.cooldowns;
		const remainingLines = [];

		for (const key in cooldowns) {
			const until = new Date(cooldowns[key]);
			if (until > now) {
				const diffSec = Math.floor((until - now) / 1000);
				const hrs = Math.floor(diffSec / 3600);
				const min = Math.floor((diffSec % 3600) / 60);
				const sec = diffSec % 60;
				const realSeconds = Math.floor(diffSec / 6);
				const label = COOLDOWN_LABELS[key] ?? key;
				remainingLines.push(`• ${label}：剩 ${hrs} 小時 ${min} 分 ${sec} 秒（現實約 ${realSeconds} 秒）`);
			}
		}

		if (remainingLines.length > 0) {
			content += `\n\n⏳ 冷卻中：\n${remainingLines.join("\n")}`;
		}
	}

	return content;
}

async function handleProfileMe(interaction) {
  const user = interaction.user;
  const discordId = user.id;
  const player = await getOrCreatePlayer(discordId);
  initializePlayer(player);
  const enterprises = await getEnterprisesByPlayer(discordId);
  const privacy = player.privacy ?? {};

  const profileMsg = formatPlayerProfile(
    user,
    player,
    enterprises,
    privacy,
    true,
  );
  await interaction.deferReply(getEphemeralForPlayer(player));

  const embed = new EmbedBuilder()
    .setTitle("玩家資訊")
    .setDescription(profileMsg)
    .setColor(0x00bfff);
  await interaction.editReply({ embeds: [embed] });
}

async function handleProfileLookup(interaction) {
  const targetUser = interaction.options.getUser("target");
  const targetId = targetUser.id;

  const player = await getPlayer(targetId);
  if (!player) {
    const embed = new EmbedBuilder()
      .setDescription("❌ 找不到這個玩家。")
      .setColor(0xed4245);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }
  initializePlayer(player);
  const privacy = player.privacy ?? {};
// src/bot/commands/player.js

  import {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
  import {playerManager} from '../utils/PlayerManager.js';
  import {replyUtils} from '../utils/ReplyUtils.js';
  import {logger} from '../utils/Logger.js';

  /**
   * 玩家指令處理器映射
   */
  const playerCommandHandlers = {
    /**
     * 建立新角色
     * @param {Object} interaction - Discord 互動物件
     */
    async start(interaction) {
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
    },

    /**
     * 查看玩家資料
     * @param {Object} interaction - Discord 互動物件
     */
    async profile(interaction) {
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
    },

    /**
     * 設置隱私選項
     * @param {Object} interaction - Discord 互動物件
     */
    async privacy(interaction) {
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
    },

    /**
     * 顯示幫助
     * @param {Object} interaction - Discord 互動物件
     */
    async help(interaction) {
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
    },

    /**
     * 轉帳
     * @param {Object} interaction - Discord 互動物件
     */
    async transfer(interaction) {
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
    },

    /**
     * 查看餘額
     * @param {Object} interaction - Discord 互動物件
     */
    async balance(interaction) {
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

        // 獲取最近交易記錄
        const transactions = await playerManager.getPlayerTransactions(user.id, 5);

        // 格式化交易記錄
        let transactionText = '無交易記錄';

        if (transactions.length > 0) {
          transactionText = transactions.map(t => {
            const formattedAmount = t.amount > 0 ? `+$${playerManager.formatMoney(t.amount)}` : `-$${playerManager.formatMoney(Math.abs(t.amount))}`;
            const date = t.createdAt.toLocaleDateString('zh-TW');
            return `${date} | ${formattedAmount} | ${t.description}`;
          }).join('\n');
        }

        // 回覆餘額訊息
        await replyUtils.info(interaction, `您的餘額為: $${playerManager.formatMoney(playerData.money)}`, {
          title: '💰 餘額查詢',
          fields: [
            {
              name: '🕒 最近交易記錄',
              value: `\`\`\`\n${transactionText}\n\`\`\``,
              inline: false
            }
          ]
        });
      } catch (error) {
        logger.error(`查看餘額時出錯: ${error.message}`, error);
        await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
      }
    }
  };

  /**
   * 玩家指令
   */
  export const playerCommand = {
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

    /**
     * 執行指令
     * @param {Object} interaction - Discord 互動物件
     */
    async execute(interaction) {
      try {
        const subcommand = interaction.options.getSubcommand();

        // 檢查子命令處理器是否存在
        if (playerCommandHandlers[subcommand]) {
          await playerCommandHandlers[subcommand](interaction);
        } else {
          await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
        }
      } catch (error) {
        logger.error(`執行玩家指令時出錯: ${error.message}`, error);
        await replyUtils.translate(interaction, 'errors.generic', {}, {type: 'error'});
      }
    }
  };

  export default playerCommand;
  if (privacy.searchable === false) {
    const embed = new EmbedBuilder()
      .setDescription("🔒 此玩家設定為不可查詢。")
      .setColor(0xed4245);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  const enterprises = await getEnterprisesByPlayer(targetId);
  const profileMsg = formatPlayerProfile(
    targetUser,
    player,
    enterprises,
    privacy,
    false,
  );

  const embed = new EmbedBuilder()
    .setTitle("玩家資訊")
    .setDescription(profileMsg)
    .setColor(0x00bfff);
  await interaction.reply({ embeds: [embed], ...getEphemeralForPlayer(player) });
}

async function handlePrivacySet(interaction) {
  const user = interaction.user;
  const discordId = user.id;
  const key = interaction.options.getString("key");
  const value = interaction.options.getString("value");
  const player = await getOrCreatePlayer(discordId);
  initializePlayer(player);

  // 預設隱私設定
  player.privacy ??= {
    replyVisibility: "private",
    profileVisibility: { money: true, enterprises: true },
    searchable: true,
  };

  if (!Object.keys(VALID_KEYS).includes(key)) {
    const embed = new EmbedBuilder()
      .setDescription("❌ 無效的設定鍵值")
      .setColor(0xed4245);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }
  if (!VALID_KEYS[key].includes(value)) {
    const embed = new EmbedBuilder()
      .setDescription(`❌ 無效的值，允許值為：${VALID_KEYS[key].join(", ")}`)
      .setColor(0xed4245);
    return await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }

  let updated = false;
  switch (key) {
    case "replyVisibility":
      if (player.privacy.replyVisibility !== value) {
        player.privacy.replyVisibility = value;
        updated = true;
      }
      break;
    case "searchable": {
      const boolVal = value === "true";
      if (player.privacy.searchable !== boolVal) {
        player.privacy.searchable = boolVal;
        updated = true;
      }
      break;
    }
    case "profileVisibility.money":
    case "profileVisibility.enterprises": {
      const field = key.split(".")[1];
      const boolVal = value === "true";
      if (player.privacy.profileVisibility[field] !== boolVal) {
        player.privacy.profileVisibility[field] = boolVal;
        updated = true;
      }
      break;
    }
  }

  if (updated) {
    await updatePlayer(discordId, player);
    const embed = new EmbedBuilder()
      .setDescription("✅ 已更新隱私設定")
      .setColor(0x57f287);
    await interaction.reply({
      embeds: [embed],
      ...getEphemeralForPlayer(player),
    });
  } else {
    const embed = new EmbedBuilder()
      .setDescription("⚠️ 此設定已是你目前的狀態")
      .setColor(0x00bfff);
    await interaction.reply({
      embeds: [embed],
      ...getEphemeralForPlayer(player),
    });
  }
}

async function handlePrivacyShow(interaction) {
  const user = interaction.user;
  const discordId = user.id;
  const player = await getOrCreatePlayer(discordId);
  const vis = player.privacy ?? {
    replyVisibility: "private",
    profileVisibility: { money: true, enterprises: true },
    searchable: true,
  };

  const embed = new EmbedBuilder()
    .setTitle("你的隱私設定")
    .setDescription(`🔐 你的隱私設定：\n• 回覆顯示：${vis.replyVisibility}\n• 可被搜尋：${vis.searchable ? "✅ 是" : "❌ 否"}\n• 個人資料可見：\n　• 金錢：${vis.profileVisibility.money ? "✅" : "❌"}\n　• 企業：${vis.profileVisibility.enterprises ? "✅" : "❌"}`)
    .setColor(0x00bfff);
  await interaction.reply({
    embeds: [embed],
    ...getEphemeralForPlayer(player),
  });
}

async function handleStart(interaction) {
  const user = interaction.user;
  const discordId = user.id;
  const player = await getOrCreatePlayer(discordId);
  if (player.initialized === true) {
    const embed = new EmbedBuilder()
      .setDescription("❌ 你已經初始化過了！")
      .setColor(0xed4245);
    return await interaction.reply({
      embeds: [embed],
      ...getEphemeralForPlayer(player),
    });
  }
  await interaction.deferReply(getEphemeralForPlayer(player));
  initializePlayer(player);
  await updatePlayer(discordId, player);
  const embed = new EmbedBuilder()
    .setDescription("✅ 帳號初始化完成！你已獲得初始資金 $1000。")
    .setColor(0x57f287);
  await interaction.editReply({ embeds: [embed] });
}

async function handlePrivacyReset(interaction) {
  const user = interaction.user;
  const discordId = user.id;
  const player = await getOrCreatePlayer(discordId);
  initializePlayer(player);
  player.privacy = {
    replyVisibility: "private",
    profileVisibility: { money: true, enterprises: true },
    searchable: true,
  };
  await updatePlayer(discordId, player);
  const embed = new EmbedBuilder()
    .setDescription("✅ 隱私設定已重設為預設值")
    .setColor(0x57f287);
  await interaction.reply({
    embeds: [embed],
    ...getEphemeralForPlayer(player),
  });
}

export default {
	data: new SlashCommandBuilder()
		.setName("player")
		.setDescription("玩家相關功能")
		.addSubcommand((sub) =>
			sub.setName("profile_me").setDescription("查看自己的帳戶資訊"),
		)
		.addSubcommand((sub) =>
			sub
				.setName("profile_lookup")
				.setDescription("查詢其他玩家的公開資訊")
				.addUserOption((opt) =>
					opt
						.setName("target")
						.setDescription("要查詢的目標")
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName("privacy_set")
				.setDescription("設定特定隱私選項")
				.addStringOption((opt) =>
					opt
						.setName("key")
						.setDescription("要設定的隱私選項")
						.setRequired(true)
						.addChoices(
							{
								name: "回覆顯示方式 (replyVisibility)",
								value: "replyVisibility",
							},
							{ name: "允許被搜尋 (searchable)", value: "searchable" },
							{ name: "個人資料：金錢顯示", value: "profileVisibility.money" },
							{
								name: "個人資料：企業顯示",
								value: "profileVisibility.enterprises",
							},
						),
				)
				.addStringOption((opt) =>
					opt
						.setName("value")
						.setDescription("要設定的值")
						.setRequired(true)
						.addChoices(
							{ name: "私人", value: "private" },
							{ name: "公開", value: "public" },
							{ name: "是", value: "true" },
							{ name: "否", value: "false" },
						),
				),
		)
    .addSubcommand((sub) =>
      sub
        .setName("privacy_reset")
        .setDescription("重設隱私設定")
    )
		.addSubcommand((sub) =>
			sub.setName("privacy_show").setDescription("查看目前的隱私設定"),
		)
		.addSubcommand((sub) => sub.setName("start").setDescription("初始化帳號")),

	async execute(interaction) {
		try {
			const sub = interaction.options.getSubcommand();

      const handlers = {
        profile_me: handleProfileMe,
        profile_lookup: handleProfileLookup,
        privacy_set: handlePrivacySet,
        privacy_show: handlePrivacyShow,
        privacy_reset: handlePrivacyReset,
        start: handleStart
      };

      if (handlers[sub]) {
        await handlers[sub](interaction);
      } else {
        const embed = new EmbedBuilder()
          .setDescription("❌ 未知的子指令")
          .setColor(0xed4245);
        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }
		} catch (err) {
			// 強化 log: 也記錄 stack trace
			logger.error(
				`[PLAYER] Error running subcommand for ${interaction.user.id} - ${err?.stack ? err.stack : err?.message ? err.message : err}`,
				err,
			);

			const isOwner = interaction.user.id === "520857472223674369";
			let errorMsg;

			if (isOwner) {
				errorMsg = `❌ 執行指令時發生錯誤\n\`\`\`\n${err?.stack ? err.stack : err?.message ? err.message : err}\n\`\`\``;
			} else {
				errorMsg = "❌ 執行指令時發生錯誤";
			}

			const embed = new EmbedBuilder()
				.setTitle("錯誤")
				.setDescription(errorMsg)
				.setColor(0xed4245);

			if (interaction.deferred || interaction.replied) {
				await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
			}
		}
	},
};
