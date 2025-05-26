import {SlashCommandBuilder} from 'discord.js';
import {createRequire} from 'node:module';
import {addGuildAdmin, listGuildAdmins, removeGuildAdmin} from '../../utils/adminControl.js';
import {sendAdminMessage} from '../../utils/ReplyUtils.js';

const require = createRequire(import.meta.url);
const config = require('../../../config/config.json');

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('管理員設定')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('新增伺服器管理員')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('要加入的使用者')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('移除伺服器管理員')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('要移除的使用者')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand(false);
      const targetUser = interaction.options.getUser('user');
      const guildId = interaction.guildId;
      const userId = interaction.user.id;
// src/bot/commands/admin/admin.js

        import {
            SlashCommandBuilder,
            PermissionFlagsBits,
            ChatInputCommandInteraction
        } from 'discord.js';

        import {adminManager} from '../../../models/AdminManager.js';
        import {ReplyUtils} from '../../../utils/ReplyUtils.js';
        import {logger} from '../../../utils/Logger.js';

        /**
         * 管理員管理指令
         * 用於新增、移除、查詢管理員及其權限
         */
        export default {
            data: new SlashCommandBuilder()
                .setName('admin')
                .setDescription('管理員相關操作')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('列出所有管理員')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('新增管理員')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('要新增的用戶')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('permissions')
                                .setDescription('權限 (多個權限用逗號分隔)')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('移除管理員')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('要移除的用戶')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('permissions')
                        .setDescription('查看或修改管理員權限')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('目標用戶')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('action')
                                .setDescription('動作類型')
                                .setRequired(true)
                                .addChoices(
                                    {name: '查看權限', value: 'view'},
                                    {name: '添加權限', value: 'add'},
                                    {name: '移除權限', value: 'remove'}
                                )
                        )
                        .addStringOption(option =>
                            option.setName('permission')
                                .setDescription('權限名稱 (如不指定則顯示所有權限)')
                                .setRequired(false)
                        )
                ),

            /**
             * 執行指令
             * @param {ChatInputCommandInteraction} interaction - Discord 互動對象
             */
            async execute(interaction) {
                try {
                    const subcommand = interaction.options.getSubcommand();

                    switch (subcommand) {
                        case 'list':
                            await handleListAdmins(interaction);
                            break;
                        case 'add':
                            await handleAddAdmin(interaction);
                            break;
                        case 'remove':
                            await handleRemoveAdmin(interaction);
                            break;
                        case 'permissions':
                            await handlePermissions(interaction);
                            break;
                    }
                } catch (error) {
                    logger.error('管理員指令執行錯誤:', error);
                    await ReplyUtils.error(
                        interaction,
                        '執行管理員指令時發生錯誤。請檢查日誌並聯繫開發人員。',
                        {error}
                    );
                }
            }
        };

        /**
         * 處理列出管理員指令
         * @param {ChatInputCommandInteraction} interaction
         */
        async function handleListAdmins(interaction) {
            await interaction.deferReply({ephemeral: true});

            try {
                const admins = await adminManager.getAllAdmins();

                if (!admins.length) {
                    return ReplyUtils.info(interaction, '目前沒有任何管理員。');
                }

                // 格式化管理員列表
                const fields = admins.map(admin => ({
                    name: `${admin.username} (${admin.discordId})`,
                    value: `權限: \`${admin.permissions.join(', ')}\``
                }));

                await ReplyUtils.info(
                    interaction,
                    `共找到 ${admins.length} 位管理員:`,
                    {
                        title: '管理員列表',
                        fields
                    }
                );
            } catch (error) {
                logger.error('獲取管理員列表失敗:', error);
                await ReplyUtils.error(interaction, '獲取管理員列表失敗。', {error});
            }
        }

        /**
         * 處理添加管理員指令
         * @param {ChatInputCommandInteraction} interaction
         */
        async function handleAddAdmin(interaction) {
            await interaction.deferReply({ephemeral: true});

            try {
                const user = interaction.options.getUser('user');
                const permissionsString = interaction.options.getString('permissions') || '';
                const permissions = permissionsString
                    ? permissionsString.split(',').map(p => p.trim())
                    : [];

                // 檢查用戶是否已是管理員
                const isAdmin = await adminManager.isAdmin(user.id);
                if (isAdmin) {
                    return ReplyUtils.warning(
                        interaction,
                        `${user.username} 已經是管理員了。`
                    );
                }

                // 添加管理員
                await adminManager.addAdmin(user.id, user.username, permissions);

                await ReplyUtils.success(
                    interaction,
                    `已成功將 ${user.username} 設為管理員!`,
                    {
                        fields: [{
                            name: '初始權限',
                            value: permissions.length
                                ? `\`${permissions.join('`, `')}\``
                                : '預設權限'
                        }]
                    }
                );
            } catch (error) {
                logger.error('添加管理員失敗:', error);
                await ReplyUtils.error(interaction, '添加管理員失敗。', {error});
            }
        }

        /**
         * 處理移除管理員指令
         * @param {ChatInputCommandInteraction} interaction
         */
        async function handleRemoveAdmin(interaction) {
            await interaction.deferReply({ephemeral: true});

            try {
                const user = interaction.options.getUser('user');

                // 檢查用戶是否為管理員
                const isAdmin = await adminManager.isAdmin(user.id);
                if (!isAdmin) {
                    return ReplyUtils.warning(
                        interaction,
                        `${user.username} 不是管理員。`
                    );
                }

                // 移除管理員
                const success = await adminManager.removeAdmin(user.id);

                if (success) {
                    await ReplyUtils.success(
                        interaction,
                        `已成功移除 ${user.username} 的管理員權限。`
                    );
                } else {
                    await ReplyUtils.error(
                        interaction,
                        `無法移除 ${user.username} 的管理員權限。`
                    );
                }
            } catch (error) {
                if (error.message.includes('超級管理員')) {
                    await ReplyUtils.error(interaction, '不能移除超級管理員。');
                } else {
                    logger.error('移除管理員失敗:', error);
                    await ReplyUtils.error(interaction, '移除管理員失敗。', {error});
                }
            }
        }

        /**
         * 處理權限管理指令
         * @param {ChatInputCommandInteraction} interaction
         */
        async function handlePermissions(interaction) {
            await interaction.deferReply({ephemeral: true});

            try {
                const user = interaction.options.getUser('user');
                const action = interaction.options.getString('action');
                const permission = interaction.options.getString('permission');

                // 檢查用戶是否為管理員
                const admin = await adminManager.getAdmin(user.id);
                if (!admin) {
                    return ReplyUtils.warning(
                        interaction,
                        `${user.username} 不是管理員。`
                    );
                }

                // 處理不同動作
                switch (action) {
                    case 'view':
                        // 查看權限
                        await ReplyUtils.info(
                            interaction,
                            `${user.username} 的權限:`,
                            {
                                fields: [{
                                    name: '目前權限',
                                    value: admin.permissions.length
                                        ? `\`${admin.permissions.join('`, `')}\``
                                        : '無權限'
                                }]
                            }
                        );
                        break;

                    case 'add':
                        // 添加權限
                        if (!permission) {
                            return ReplyUtils.warning(interaction, '請指定要添加的權限。');
                        }

                        const addSuccess = await adminManager.addPermission(user.id, permission);
                        if (addSuccess) {
                            await ReplyUtils.success(
                                interaction,
                                `已成功為 ${user.username} 添加 \`${permission}\` 權限。`
                            );
                        } else {
                            await ReplyUtils.error(
                                interaction,
                                `無法為 ${user.username} 添加 \`${permission}\` 權限。`
                            );
                        }
                        break;

                    case 'remove':
                        // 移除權限
                        if (!permission) {
                            return ReplyUtils.warning(interaction, '請指定要移除的權限。');
                        }

                        const removeSuccess = await adminManager.removePermission(user.id, permission);
                        if (removeSuccess) {
                            await ReplyUtils.success(
                                interaction,
                                `已成功從 ${user.username} 移除 \`${permission}\` 權限。`
                            );
                        } else {
                            await ReplyUtils.error(
                                interaction,
                                `無法從 ${user.username} 移除 \`${permission}\` 權限，可能是核心權限或用戶是超級管理員。`
                            );
                        }
                        break;
                }
            } catch (error) {
                logger.error('管理權限操作失敗:', error);
                await ReplyUtils.error(interaction, '管理權限操作失敗。', {error});
            }
        }
      const isSuperAdmin = (config.adminIds || []).includes(userId);
      if (!isSuperAdmin) {
        return sendAdminMessage(interaction, '🚫 僅限系統管理員操作。');
      }

      if (sub === 'add') {
        const adminIds = await listGuildAdmins(guildId);
        if (adminIds.includes(targetUser.id)) {
          return sendAdminMessage(interaction, `⚠️ ${targetUser.tag} 已經是此伺服器管理員`);
        }
        await addGuildAdmin(guildId, targetUser.id);
        return sendAdminMessage(interaction, `✅ 已新增 ${targetUser.tag} 為此伺服器管理員`);
      }
      if (sub === 'remove') {
        const adminIds = await listGuildAdmins(guildId);
        if (!adminIds.includes(targetUser.id)) {
          return sendAdminMessage(interaction, `⚠️ ${targetUser.tag} 並不是此伺服器管理員`);
        }
        await removeGuildAdmin(guildId, targetUser.id);
        return sendAdminMessage(interaction, `✅ 已移除 ${targetUser.tag} 的管理員權限`);
      }
      // list subcommand (default/fallback)
      if (sub === 'list' || sub == null) {
        // 取得管理員 ID 清單
        const adminIds = await listGuildAdmins(guildId);
        if (!adminIds || adminIds.length === 0) {
          return sendAdminMessage(interaction, '👮 此伺服器尚未設定管理員。');
        }
        const tags = [];
        for (const id of adminIds) {
          const user = await interaction.client.users.fetch(id).catch(() => null);
          tags.push(user ? `${user.tag}` : "❓ 不明使用者");
        }
        return sendAdminMessage(interaction, `👮 本伺服器管理員清單：\n${tags.join('\n')}`);
      }
    } catch (err) {
      logger.error(
        "[ADMIN] 指令出錯",
        err && (typeof err === "object" ? (err.stack || JSON.stringify(err, null, 2)) : err) || "Unknown Error"
      );
      try {
        if (interaction.deferred || interaction.replied) {
          await sendAdminMessage(interaction, '❌ 執行指令 admin 時發生錯誤');
        } else {
          await sendAdminMessage(interaction, '❌ 執行指令 admin 時發生錯誤');
        }
      } catch (followErr) {
        logger.error(
          "[ADMIN] 回覆錯誤也失敗",
          followErr && (typeof followErr === "object" ? (followErr.stack || JSON.stringify(followErr, null, 2)) : followErr) || "Unknown Error"
        );
      }
    }
  }
};