// 📁 src/bot/commands/test.js
import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/Logging.js';

function getLargestPrimeBelow(n) {
  if (n <= 2) return null;
  const primes = [2];

  for (let i = 3; i < n; i++) {
    let isPrime = true;
    for (let j = 0; j < primes.length && primes[j] * primes[j] <= i; j++) {
      if (i % primes[j] === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }

  return primes.at(-1) ?? null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('輸入數字，回傳小於該數的最大質數')
    .addIntegerOption(option =>
      option.setName('數字')
            .setDescription('一個正整數')
            .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const input = interaction.options.getInteger('數字');

    logger.info(`[TEST] ${userId} 輸入 ${input}`);

    if (input <= 2 || input > 1000) {
      return interaction.reply({
        content: '⚠️ 請輸入介於 3 到 1000 的整數',
        ephemeral: true,
      });
    }

    try {
      const result = getLargestPrimeBelow(input);

      if (!result) {
        return interaction.reply({
          content: '❌ 找不到質數結果',
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `✅ 小於 ${input} 的最大質數是：**${result}**`,
        ephemeral: true,
      });

    } catch (err) {
      logger.error(`[TEST] 執行錯誤：${userId}`, err);

      const errorReply = { content: '❌ 測試指令執行失敗', ephemeral: true };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(errorReply);
      } else {
        await interaction.reply(errorReply);
      }
    }
  }
};