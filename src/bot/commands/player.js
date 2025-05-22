import { MessageFlags, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
	getOrCreatePlayer,
	getPlayer,
	updatePlayer,
} from "../../services/playerService.js";
import { getEnterprisesByPlayer } from "../../services/enterpriseService.js";
import { logger } from "../utils/Logging.js";
import { getEphemeralForPlayer} from "../utils/replyWithPrivacy.js";

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

	if (!isSelf && (!showMoney || !showEnterprises)) {
		content += "\n\n🔒 對方部分資料已設為私人，只有本人能看到完整訊息。";
	}
	return content;
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
			const user = interaction.user;
			const discordId = user.id;

			// 查看自己
			if (sub === "profile_me") {
				const player = await getOrCreatePlayer(discordId);
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

				// 查詢別人
			} else if (sub === "profile_lookup") {
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
				const privacy = player.privacy ?? {};

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

				// 設定隱私
			} else if (sub === "privacy_set") {
				const key = interaction.options.getString("key");
				const value = interaction.options.getString("value");
				const player = await getOrCreatePlayer(discordId);

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

				// 顯示目前隱私設定
			} else if (sub === "privacy_show") {
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
			} else if (sub === "start") {
				const player = await getOrCreatePlayer(discordId);
				// 判斷是否新帳號，可依你的初始預設值調整
				if (player.money !== 500) {
					const embed = new EmbedBuilder()
						.setDescription("❌ 你已經初始化過了！")
						.setColor(0xed4245);
					return await interaction.reply({
						embeds: [embed],
						...getEphemeralForPlayer(player),
					});
				}
				await interaction.deferReply(getEphemeralForPlayer(player));
				// 這裡可以加入初始化邏輯，例如給予初始資金、設置預設企業等
				player.money = 500;
				player.privacy = {
					replyVisibility: "private",
					profileVisibility: { money: true, enterprises: true },
					searchable: true,
				};
				await updatePlayer(discordId, player);
				const embed = new EmbedBuilder()
					.setDescription("✅ 帳號初始化完成！你已獲得初始資金 $500。")
					.setColor(0x57f287);
				await interaction.editReply({ embeds: [embed] });
			} else if (sub === "privacy_reset") {
        const player = await getOrCreatePlayer(discordId);
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
