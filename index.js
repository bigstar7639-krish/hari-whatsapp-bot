const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');
const QRCodeLib = require('qrcode'); // Required for generating the clean image link

const app = reportExpressSetup();
const port = process.env.PORT || 3000;

let latestQrImage = '';

// 1. Initialize WhatsApp Client First
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

// 2. Handle QR Code Generation Natively
client.on('qr', async (qr) => {
    // Terminal backup log
    qrcode.generate(qr, { small: true });
    
    // Generates a clean URL web graphic
    try {
        latestQrImage = await QRCodeLib.toDataURL(qr);
        console.log('👉 QR web image updated! Refresh your live onrender link to view.');
    } catch (err) {
        console.error('Failed to generate image string:', err);
    }
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot is fully ready and operational!');
});

// 3. Process AI Messaging Input Custom Commands
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
            console.error("AI Assistant Module Error:", error);
        }
    }
});

client.initialize();

// 4. Web Interface Configuration Layer
function reportExpressSetup() {
    return express();
}

app.get('/', (req, res) => {
    if (latestQrImage) {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Scan WhatsApp Bot</title>
                <style>
                    body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#f0f2f5; font-family:sans-serif; margin:0; padding:20px; box-sizing:border-box; text-align:center; }
                    .card { background:white; padding:30px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08); max-width:400px; width:100%; }
                    img { max-width:100%; height:auto; margin:20px 0; border:1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Link Your Bot Account</h2>
                    <p style="color:#666;">Open WhatsApp > Linked Devices > Scan Code</p>
                    <img src="${latestQrImage}" alt="WhatsApp QR Code" />
                    <p style="font-size:12px; color:#999;">If the code expires, simply refresh this webpage.</p>
                </div>
            </body>
            </html>
        `);
    } else {
        res.send(`
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center; color:#333;">
                <h2>Bot Engine Active</h2>
                <p>Initializing pairing matrix. Refresh this browser tab in 10-15 seconds to see your scanner graphic.</p>
            </div>
        `);
    }
});

app.listen(port, () => console.log(`Server endpoint listening on port ${port}`));
