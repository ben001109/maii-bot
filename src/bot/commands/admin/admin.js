import { SlashCommandBuilder } from 'discord.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const config = require('../../../config/config.json');
import { redis } from '../../../redis/redisClient.js';
import { logger } from '../../utils/Logging.js';

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
        return interaction.reply({ content: '🚫 僅限系統管理員操作。', ephemeral: true });
      }

      const key = `admin:guild:${guildId}`;
      if (sub === 'add') {
        const now = Math.floor(Date.now() / 1000);
        await redis.zadd(key, now, targetUser.id);
        return interaction.reply({ content: `✅ 已新增 ${targetUser.tag} 為此伺服器管理員`, ephemeral: true });
      }
      if (sub === 'remove') {
        await redis.zrem(key, targetUser.id);
        return interaction.reply({ content: `✅ 已移除 ${targetUser.tag} 的管理員權限`, ephemeral: true });
      }
      // list subcommand (default/fallback)
      if (sub === 'list' || sub == null) {
        // 取得管理員 ID 清單
        const members = await redis.zrange(key, 0, -1, 'WITHSCORES');
        if (!members || members.length === 0) {
          return interaction.reply({ content: '👮 此伺服器尚未設定管理員。', ephemeral: true });
        }
        const pairs = [];
        for (let i = 0; i < members.length; i += 2) {
          const id = members[i];
          const timestamp = new Date(Number(members[i + 1]) * 1000).toLocaleString();
          const user = await interaction.client.users.fetch(id).catch(() => null);
          pairs.push(user ? `${user.tag}（${timestamp}）` : `❓ 不明使用者（${timestamp}）`);
        }
        return interaction.reply({ content: `👮 本伺服器管理員清單：\n${pairs.join('\n')}`, ephemeral: true });
      }
    } catch (err) {
      logger.error(
        "[ADMIN] 指令出錯",
        err && (typeof err === "object" ? (err.stack || JSON.stringify(err, null, 2)) : err) || "Unknown Error"
      );
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '❌ 執行指令 admin 時發生錯誤', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ 執行指令 admin 時發生錯誤', ephemeral: true });
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