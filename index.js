const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');
const Dashboard = require('whatsapp-web-dashboard');

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

const dashboard = new Dashboard({
    title: 'WhatsApp Bot Dashboard',
    baseUrl: '/',
    client: client
});

app.use('/', dashboard.router());

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot Client engine is ready!');
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
            if (data.choices && data.choices.message) {
                await message.reply(data.choices.message.content);
            }
        } catch (error) {
            console.error("AI Node Processing failure:", error);
        }
    }
});

client.initialize();
app.listen(port, () => console.log(`Dashboard panel serving on port ${port}`));
