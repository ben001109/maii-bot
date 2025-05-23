import { SlashCommandBuilder } from 'discord.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const config = require('../../../config/config.json');
import { addGuildAdmin, removeGuildAdmin, listGuildAdmins } from '../../utils/adminControl.js';
import { logger } from '../../utils/Logging.js';
import { sendAdminMessage } from '../../utils/ReplyUtils.js';

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