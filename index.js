const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

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

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('👉 QR Code generated! Scan this in your logs.');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot is ready!');
});

client.on('message', async (message) => {
    if (message.body.startsWith('!ai ')) {
        const userPrompt = message.body.slice(4).trim();
        if (!userPrompt) return;

        try {
            const chat = await message.getChat();
            await chat.sendStateTyping();

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
            if (data.choices && data.choices[0] && data.choices[0].message) {
                await message.reply(data.choices[0].message.content);
            }
        } catch (error) {
            console.error("AI Error:", error);
        }
    }
});

client.initialize();
app.get('/', (req, res) => res.send('Bot Active'));
app.listen(port, () => console.log(`Listening on port ${port}`));
