const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TOKEN = process.env.TOKEN; // توكن البوت
let players = [];
const maxPlayers = 10;
let gameStarted = false;

// تسجيل الأوامر
client.once('ready', async () => {
    console.log(`✅ تم تسجيل الدخول كبوت: ${client.user.tag}`);
});

// التعامل مع أوامر Slash
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    // بدء لعبة المافيا
    if (interaction.commandName === 'مافيا') {
        if (gameStarted) return interaction.reply('❌ اللعبة بدأت بالفعل!');
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('join').setLabel('انضمام').setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder()
            .setTitle('👥 لعبة المافيا')
            .setDescription(`اضغط "انضمام" للانضمام إلى اللعبة.\nالعدد الحالي: (${players.length}/${maxPlayers})`)
            .setColor(0xF1C40F);

        await interaction.reply({ embeds: [embed], components: [row] });
    }

    // بدء لعبة الروليت
    if (interaction.commandName === 'روليت') {
        if (players.length < 2) return interaction.reply('❌ يجب أن يكون هناك لاعبين على الأقل!');

        const eliminatedPlayer = players[Math.floor(Math.random() * players.length)];
        players = players.filter(player => player !== eliminatedPlayer);
        
        const embed = new EmbedBuilder()
            .setTitle('🎡 عجلة الروليت')
            .setDescription(`تم طرد اللاعب: **${eliminatedPlayer}**\nالعدد المتبقي: ${players.length}`)
            .setColor(0x3498DB);
        
        await interaction.reply({ embeds: [embed] });

        // إذا بقي لاعب واحد، أعلنه الفائز
        if (players.length === 1) {
            const winnerEmbed = new EmbedBuilder()
                .setTitle('🏆 الفائز!')
                .setDescription(`اللاعب الفائز هو: **${players[0]}**`)
                .setColor(0x2ECC71);
            await interaction.followUp({ embeds: [winnerEmbed] });
            gameStarted = false; // إعادة ضبط اللعبة
            players = []; // إعادة تعيين اللاعبين
        }
    }
});

// التعامل مع انضمام اللاعبين
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'join') {
        if (players.includes(interaction.user)) {
            return interaction.reply({ content: '❌ أنت مسجل بالفعل!', ephemeral: true });
        }
        players.push(interaction.user);
        const embed = new EmbedBuilder()
            .setTitle('👥 لعبة المافيا')
            .setDescription(players.map((p, i) => `${i + 1}. ${p}`).join('\n') + `\n\nالعدد: (${players.length}/${maxPlayers})`)
            .setColor(0xF1C40F);
        await interaction.update({ embeds: [embed] });

        // بدء اللعبة إذا بلغ الحد الأقصى
        if (players.length === maxPlayers) startMafiaGame(interaction);
    }
});

// بدء لعبة المافيا وتوزيع الأدوار
async function startMafiaGame(interaction) {
    gameStarted = true;
    await interaction.followUp('🎉 اللعبة بدأت! يتم توزيع الأدوار الآن...');
    const roles = ['مافيا', 'طبيب', 'محقق', ...Array(maxPlayers - 3).fill('مواطن')];
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);

    players.forEach(async (player, index) => {
        const role = shuffledRoles[index];
        const roleEmbed = new EmbedBuilder()
            .setTitle('🎭 دورك في اللعبة')
            .setDescription(`تم تعيين دورك: **${role}**`)
            .setColor(role === 'مافيا' ? 0xE74C3C : 0x2ECC71);
        await player.send({ embeds: [roleEmbed] });
    });

    interaction.followUp('🔔 الأدوار تم توزيعها! اللعبة مستمرة...');
}

// تشغيل البوت
client.login(TOKEN);
