import { SlashCommandBuilder } from 'discord.js';
import util from 'node:util';
import { redis } from '../../../redis/redisClient.js';
import { getPlayer } from '../../../services/playerService.js';
import { sendSuccess,sendError } from '../../utils/ReplyUtils.js';
import { EconHandler } from '../../utils/handler/ecomHandler.js';

export default {
  data: new SlashCommandBuilder()
    .setName('econ')
    .setDescription('經濟系統指令')
    .addSubcommand(sub =>
      sub.setName('balance')
        .setDescription('查看你的資產餘額'))
    .addSubcommand(sub =>
      sub.setName('pay')
        .setDescription('轉帳給其他玩家')
        .addUserOption(opt =>
          opt.setName('user').setDescription('接收方').setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('amount').setDescription('轉帳金額').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('top')
        .setDescription('查看資產排行榜'))
    .addSubcommand(sub =>
      sub.setName('transfer')
        .setDescription('轉帳給其他玩家')
        .addUserOption(opt =>
          opt.setName('user').setDescription('接收方').setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('amount').setDescription('轉帳金額').setRequired(true))),
  /**
   * @param {import('discord.js').CommandInteraction} interaction
   */
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;

    if (sub === 'balance') {
      const player = await getPlayer(discordId);
      const money = player?.money ?? 0;
      return sendSuccess(interaction, `你目前擁有 $${money}`, player);
    }

    if (sub === 'pay' || sub === 'transfer') {
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      if (!target || amount <= 0 || target.id === discordId) {
        return sendError(interaction, '❌ 轉帳失敗，請確認對象與金額無誤。');
      }

      const result = await EconHandler.transferMoney(discordId, target.id, amount);
      if (!result.success) {
        return sendError(interaction, `❌ 轉帳失敗：${result.message ?? '未知錯誤'}`);
      }

      return sendSuccess(interaction, `你已轉帳 $${amount} 給 <@${target.id}>`);
    }

    if (sub === 'top') {
      const scanAsync = util.promisify(redis.scan).bind(redis);
      let cursor = '0';
      const allPlayers = [];

      do {
        const [nextCursor, keys] = await scanAsync(cursor, 'MATCH', 'player:*', 'COUNT', 1000);
        for (const key of keys) {
          const discordId = key.split(':')[1];
          const player = await getPlayer(discordId);
          if (player?.money && player.money > 0) allPlayers.push(player);
        }
        cursor = nextCursor;
      } while (cursor !== '0');

      const sorted = allPlayers.sort((a, b) => b.money - a.money).slice(0, 10);
      const content = sorted.map((p, i) => `**#${i + 1}** <@${p.discordId}> - $${p.money}`).join('\n') || '無任何資料';

      return interaction.reply({
        embeds: [{ title: '🏆 資產排行榜', description: content, color: 0xf1c40f }]
      });
    }
  }
};