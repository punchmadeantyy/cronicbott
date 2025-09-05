const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const quickdb = require('quick.db');

const token = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`✅ Bot Online: ${client.user.tag}`);
});

// Admin Command: !genkey <duration_in_days>
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !genkey command - RESTRICT TO YOUR USER ID
    if (message.content.startsWith('!genkey') && message.author.id === '1398531861411528808') {
        const args = message.content.split(' ');
        if (args.length < 2) {
            return message.reply('❌ Usage: `!genkey <duration_in_days>`');
        }

        const durationDays = parseInt(args[1]);
        if (isNaN(durationDays)) {
            return message.reply('❌ Please provide a valid number of days.');
        }

        const expirationTime = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        const licenseKey = 'CRONIC-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        quickdb.set(`key_${licenseKey}`, {
            expires: expirationTime,
            generatedAt: Date.now()
        });

        try {
            await message.author.send(`🔑 **New License Key Generated**\n**Key:** ||${licenseKey}||\n**Duration:** ${durationDays} days\n**Expires:** <t:${Math.floor(expirationTime / 1000)}:R>`);
            message.reply('✅ License key generated and sent to your DMs.');
        } catch (error) {
            message.reply('❌ I couldn\'t DM you. Please enable DMs from server members.');
        }
    }

    // User Command: !redeem <key>
    if (message.channel.name === 'redeem-key' && message.content.startsWith('!redeem')) {
        const args = message.content.split(' ');
        const licenseKey = args[1];

        if (!licenseKey) {
            return message.reply('❌ Please provide a license key. Usage: `!redeem YOUR_KEY`');
        }

        const keyData = quickdb.get(`key_${licenseKey}`);
        
        if (!keyData) {
            return message.reply('❌ Invalid license key.');
        }

        if (keyData.expires < Date.now()) {
            quickdb.delete(`key_${licenseKey}`);
            return message.reply('❌ This license key has expired.');
        }

        const customerRole = message.guild.roles.cache.find(role => role.name === '💎・Customer');
        if (!customerRole) {
            return message.reply('❌ Error: Customer role not found. Contact an admin.');
        }

        try {
            await message.member.roles.add(customerRole);
            quickdb.delete(`key_${licenseKey}`);
            message.reply(`✅ License key redeemed! You now have access until <t:${Math.floor(keyData.expires / 1000)}:D>.`);
        } catch (error) {
            console.error(error);
            message.reply('❌ Failed to assign the role. Please contact an admin.');
        }
    }
});

client.login(token);
