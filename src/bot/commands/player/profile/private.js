import { SlashCommandBuilder } from 'discord.js';
import { getOrCreatePlayer, updatePlayer } from '../../../services/playerService.js';
import { replyWithPrivacy } from '../../utils/replyWithPrivacy.js';

const VALID_KEYS = {
  replyVisibility: ['private', 'public'],
  searchable: ['true', 'false'],
  'profileVisibility.money': ['true', 'false'],
  'profileVisibility.enterprises': ['true', 'false']
};

export default {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('玩家指令')
    .addSubcommand(sub =>
      sub.setName('private_set')
        .setDescription('設定特定隱私選項')
        .addStringOption(opt =>
          opt.setName('key')
            .setDescription('要設定的隱私選項')
            .setRequired(true)
            .addChoices(
              { name: '回覆顯示方式 (replyVisibility)', value: 'replyVisibility' },
              { name: '允許被搜尋 (searchable)', value: 'searchable' },
              { name: '個人資料：金錢顯示', value: 'profileVisibility.money' },
              { name: '個人資料：企業顯示', value: 'profileVisibility.enterprises' }
            ))
        .addStringOption(opt =>
          opt.setName('value')
            .setDescription('要設定的值')
            .setRequired(true)
            .addChoices(
              { name: '私人', value: 'private' },
              { name: '公開', value: 'public' },
              { name: '是', value: 'true' },
              { name: '否', value: 'false' }
            )))
    .addSubcommand(sub =>
      sub.setName('private_show')
        .setDescription('查看目前的隱私設定')),

  async execute(interaction) {
    try {
      const { options, user } = interaction;
      const sub = options.getSubcommand();
      const player = await getOrCreatePlayer(user.id);

      // 預設隱私設定
      player.privacy ??= {
        replyVisibility: 'private',
        profileVisibility: { money: true, enterprises: true },
        searchable: true
      };

      if (sub === 'private_set') {
        const key = options.getString('key');
        const value = options.getString('value');

        if (!Object.keys(VALID_KEYS).includes(key)) {
          return await replyWithPrivacy(interaction, player, '❌ 無效的設定鍵值');
        }

        if (!VALID_KEYS[key].includes(value)) {
          return await replyWithPrivacy(interaction, player, `❌ 無效的值，允許值為：${VALID_KEYS[key].join(', ')}`);
        }

        let updated = false;
        switch (key) {
          case 'replyVisibility':
            if (player.privacy.replyVisibility !== value) {
              player.privacy.replyVisibility = value;
              updated = true;
            }
            break;
          case 'searchable': {
            const boolVal = value === 'true';
            if (player.privacy.searchable !== boolVal) {
              player.privacy.searchable = boolVal;
              updated = true;
            }
            break;
          }
          case 'profileVisibility.money':
          case 'profileVisibility.enterprises': {
            const field = key.split('.')[1];
            const boolVal = value === 'true';
            if (player.privacy.profileVisibility[field] !== boolVal) {
              player.privacy.profileVisibility[field] = boolVal;
              updated = true;
            }
            break;
          }
        }

        if (updated) {
          await updatePlayer(user.id, player);
          return await replyWithPrivacy(interaction, player, '✅ 已更新隱私設定');
        }
          return await replyWithPrivacy(interaction, player, '⚠️ 此設定已是你目前的狀態');
      }

      if (sub === 'private_show') {
        const vis = player.privacy;
        return await replyWithPrivacy(
          interaction,
          player,
          `🔐 你的隱私設定：\n• 回覆顯示：${vis.replyVisibility}\n• 可被搜尋：${vis.searchable ? '✅ 是' : '❌ 否'}\n• 個人資料可見：\n　• 金錢：${vis.profileVisibility.money ? '✅' : '❌'}\n　• 企業：${vis.profileVisibility.enterprises ? '✅' : '❌'}`
        );
      }

    } catch (err) {
      console.error('❌ [private.js execute] 錯誤:', err);
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({ content: '❌ 發生未預期錯誤，請稍後再試。', ephemeral: true });
      }
        return interaction.reply({ content: '❌ 發生未預期錯誤，請稍後再試。', ephemeral: true });
    }
  }
};