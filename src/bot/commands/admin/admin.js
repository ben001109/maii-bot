

const { SlashCommandBuilder } = require('discord.js');
const config = require('../../../config');
const redis = require('../../../lib/redis');

module.exports = {
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
      await redis.sadd(key, targetUser.id);
      return interaction.reply({ content: `✅ 已新增 ${targetUser.tag} 為此伺服器管理員`, ephemeral: true });
    }
    if (sub === 'remove') {
      await redis.srem(key, targetUser.id);
      return interaction.reply({ content: `✅ 已移除 ${targetUser.tag} 的管理員權限`, ephemeral: true });
    }
    // list subcommand (default/fallback)
    if (sub === 'list' || sub == null) {
      // 取得管理員 ID 清單
      const ids = await redis.smembers(key);
      if (!ids || ids.length === 0) {
        return interaction.reply({ content: '👮 此伺服器尚未設定管理員。', ephemeral: true });
      }
      // 批次抓取使用者 tag
      const users = await Promise.all(ids.map(id => interaction.client.users.fetch(id).catch(() => null)));
      const names = users.map(u => u ? `${u.tag}` : '❓ 無法取得使用者').join('\n');
      return interaction.reply({ content: `👮 本伺服器管理員清單：\n${names}`, ephemeral: true });
    }
  }
};