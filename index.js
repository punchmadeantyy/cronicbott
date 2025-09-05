const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const quickdb = require('quick.db'); // Using quick.db for simplicity

const token = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`✅ Bot Online: ${client.user.tag}`);
});

// Admin Command: !genkey <duration_in_days>
client.on('messageCreate', async (message) => {
    // Prevent bot from responding to other bots and itself
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

        // Calculate expiration time (current time + duration in milliseconds)
        const expirationTime = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

        // Generate a random license key (e.g., CRONIC-XXXX)
        const licenseKey = 'CRONIC-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        // Save the key and its expiration time to the database
        // We store the expiration time, not the duration
        quickdb.set(`key_${licenseKey}`, {
            expires: expirationTime,
            generatedAt: Date.now()
        });

        // Send the key to the admin in a DM for security
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

        // Check if the key exists in the database
        const keyData = quickdb.get(`key_${licenseKey}`);
        
        if (!keyData) {
            return message.reply('❌ Invalid license key.');
        }

        // Check if the key has expired
        if (keyData.expires < Date.now()) {
            quickdb.delete(`key_${licenseKey}`); // Clean up expired key
            return message.reply('❌ This license key has expired.');
        }

        // Find the Customer role
        const customerRole = message.guild.roles.cache.find(role => role.name === '💎・Customer');
        if (!customerRole) {
            return message.reply('❌ Error: Customer role not found. Contact an admin.');
        }

        // Add the role to the user
        try {
            await message.member.roles.add(customerRole);
            // Delete the key so it can't be used again
            quickdb.delete(`key_${licenseKey}`);
            
            message.reply(`✅ License key redeemed! You now have access until <t:${Math.floor(keyData.expires / 1000)}:D>.`);
        } catch (error) {
            console.error(error);
            message.reply('❌ Failed to assign the role. Please contact an admin.');
        }
    }
});

// Simple test command to see if the bot is reading messages
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  // If someone says "ping", the bot will reply "pong!"
  if (message.content.toLowerCase() === 'ping') {
    message.reply('Pong! 🏓');
  }
});
client.login(token);
