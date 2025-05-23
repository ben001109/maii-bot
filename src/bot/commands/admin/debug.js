import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { redis } from '../../../redis/redisClient.js';
import { prisma } from '../../../db/prismaClient.js';
import { sendAdminMessage } from '../../utils/ReplyUtils.js';
import util from 'node:util';
import { getAllPlayers } from '../../../services/playerService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('管理員限定：調試與資料查詢工具')
    .addSubcommand(sub =>
      sub.setName('raw')
        .setDescription('取得 Redis 原始資料')
        .addStringOption(opt =>
          opt.setName('key').setDescription('Redis Key 名稱').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('player')
        .setDescription('取得玩家資料')
        .addUserOption(opt =>
          opt.setName('user').setDescription('Discord 使用者 ID').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('keys')
        .setDescription('列出符合 pattern 的 Redis Key')
        .addStringOption(opt =>
          opt.setName('match')
            .setDescription('選擇要列出的 Redis Key 類型')
            .setRequired(true)
            .addChoices(
              { name: '玩家資料', value: 'player:*' },
              { name: '企業資料', value: 'enterprise:*' },
              { name: '系統設定', value: 'system:*' },
              { name: '快取資料', value: 'cache:*' }
            )))
    .addSubcommand(sub =>
      sub.setName('playerlist')
        .setDescription('列出所有玩家 ID 與資產摘要'))
    .addSubcommand(sub =>
      sub.setName('db')
        .setDescription('從 PostgreSQL 主資料庫查詢表內容')
        .addStringOption(opt =>
          opt.setName('table').setDescription('資料表名稱').setRequired(true))
        .addStringOption(opt =>
          opt.setName('id').setDescription('主鍵（可選）'))),
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return sendAdminMessage(interaction, '🚫 僅限管理員使用。');
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'raw') {
      const key = interaction.options.getString('key');
      const data = await redis.get(key);
      if (!data) {
        return sendAdminMessage(interaction, `❌ 找不到 Redis key：\`${key}\``);
      }
      return sendAdminMessage(interaction, `📦 Redis \`${key}\` 內容：\n\`\`\`json\n${data}\n\`\`\``);
    }
    if (sub === 'player') {
      const user = interaction.options.getUser('user');
      const field = interaction.options.getString('field');
      const key = `player:${user.id}`;
      const data = await redis.get(key);
      if (!data) {
        return sendAdminMessage(interaction, `❌ 找不到玩家資料：\`${user.id}\``);
      }
      const playerData = JSON.parse(data);
      if (field && field in playerData) {
        return sendAdminMessage(interaction, `📦 玩家 \`${user.id}\` 的 \`${field}\` 欄位：\n\`\`\`json\n${JSON.stringify(playerData[field], null, 2)}\n\`\`\``);
      }

      const lines = Object.entries(playerData).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      return sendAdminMessage(interaction, `📦 玩家原始資料：\n${lines.join('\n')}`);
    }

    if (sub === 'keys') {
      const pattern = interaction.options.getString('match');
      const scanAsync = util.promisify(redis.scan).bind(redis);
      let cursor = '0';
      const keys = [];
      do {
        const [nextCursor, found] = await scanAsync(cursor, 'MATCH', pattern, 'COUNT', 100);
        keys.push(...found);
        cursor = nextCursor;
      } while (cursor !== '0');
      return sendAdminMessage(interaction, `🔑 共 ${keys.length} 筆符合：\n\`\`\`\n${keys.join('\n')}\n\`\`\``);
    }

    if (sub === 'playerlist') {
      const list = await getAllPlayers();
      const formatted = list.map(p => `• <@${p.discordId}> - $${p.money ?? 0}`).join('\n') || '（無資料）';
      return sendAdminMessage(interaction, `📋 玩家清單：共 ${list.length} 位\n${formatted}`);
    }

    if (sub === 'db') {
      const prismaModels = {
        player: prisma.player,
        enterprise: prisma.enterprise,
        transaction: prisma.transaction
      };

      let table = interaction.options.getString('table');
      table = table.toLowerCase();
      if (table.endsWith('s')) {
        table = table.slice(0, -1);
      }

      if (!prismaModels[table]) {
        return sendAdminMessage(interaction, `❌ 未知資料表：\`${table}\``);
      }

      const model = prismaModels[table];
      const id = interaction.options.getString('id');
      try {
        let result;
        if (id) {
          result = await model.findUnique({ where: { id } });
        } else {
          result = await model.findMany({ take: 10 });
        }

        if (!result || (Array.isArray(result) && result.length === 0)) {
          return sendAdminMessage(interaction, `🔍 查無資料於 \`${table}\``);
        }

        const lines = [];
        if (Array.isArray(result)) {
          result.forEach((row, index) => {
            lines.push(`─ Record #${index + 1}`);
            for (const [k, v] of Object.entries(row)) {
              lines.push(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
            }
          });
        } else {
          for (const [k, v] of Object.entries(result)) {
            lines.push(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
          }
        }

        return sendAdminMessage(interaction, `🗃️ \`${table}\` 查詢結果：\n${lines.join('\n')}`);
      } catch (err) {
        return sendAdminMessage(interaction, `❌ 查詢失敗：${err.message}`);
      }
    }
  }
}