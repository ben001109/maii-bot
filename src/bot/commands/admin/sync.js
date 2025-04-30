import { SlashCommandBuilder } from 'discord.js';
import { syncRedisToPostgres } from '../../../db/syncService.js';

const ADMIN_IDS = ['你的DiscordID']; // ⚠️ 請填你的 ID

export default {
  data: new SlashCommandBuilder()
    .setName('admin-sync')
    .setDescription('🛠️ 管理員專用：將 Redis 中的資料同步到 PostgreSQL'),

  async execute(interaction) {
    if (!ADMIN_IDS.includes(interaction.user.id)) {
      return interaction.reply({
        content: '🚫 你沒有權限使用這個指令。',
        ephemeral: true
      });
    }

    const { playerCount, enterpriseCount } = await syncRedisToPostgres();

    await interaction.reply({
      content: `✅ 已同步完成！玩家：${playerCount}，企業：${enterpriseCount}`,
      ephemeral: true
    });
  }
};
