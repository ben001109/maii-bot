import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('測試指令')
    .addIntegerOption(option => 
      option.setName('數字')
            .setDescription('一個數字')
            .setRequired(true)
    ),

  async execute(interaction) {
    console.log("test start");
    const input = interaction.options.getInteger('數字');
    if(input>1000 || input<=0){
        await interaction.reply({
            content: "輸入超出範圍",
            ephemeral: true
          });
        return;
    }
    const p = [2];
    for (let i = 3; i < input; i++) {
        let is_prime = true;
        for (let j = 0; j < p.length && p[j]*p[j]<=i; j++) {
            if(i%p[j] === 0){
                is_prime = false;
                break;
            }
            
        }
        if(is_prime){
            p.push(i);
        }
    }
    await interaction.reply({
      content: `質數：${p[p.length-1]}`,
      ephemeral: true
    });
  }
};
