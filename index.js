const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch'); // Required to communicate with Groq

const app = express();
const port = process.env.PORT || 3000;

// Initialize WhatsApp Client with specific arguments for Render
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// Displays the QR Code in Render Logs
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated! Go to Render logs to scan.');
});

client.on('ready', () => {
    console.log('WhatsApp Bot is successfully authenticated and ready!');
});

// Responds when a user types "!ai <question>"
client.on('message', async (message) => {
    if (message.body.startsWith('!ai ')) {
        const userPrompt = message.body.slice(4);

        try {
            const response = await fetch("https://groq.com", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.META_LAMA_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama3-8b-8192", 
                    messages: [{ role: "user", content: userPrompt }]
                })
            });

            const data = await response.json();
            const aiReply = data.choices[0].message.content;

            await message.reply(aiReply);

        } catch (error) {
            console.error("AI API Error:", error);
            await message.reply("Sorry, I couldn't process that with Meta AI right now.");
        }
    }
});

client.initialize();

app.get('/', (req, res) => res.send('Bot Status: Online'));
app.listen(port, () => console.log(`Web server listening on port ${port}`));
