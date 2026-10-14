const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');
const QRCodeLib = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

let latestQrImage = '';
let botStatus = 'disconnected'; // 'disconnected' or 'ready'

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

client.on('qr', async (qr) => {
    qrcodeTerminal.generate(qr, { small: true });
    botStatus = 'disconnected';
    try {
        latestQrImage = await QRCodeLib.toDataURL(qr);
    } catch (err) {
        console.error('QR URL Generation Failed:', err);
    }
});

client.on('ready', () => {
    console.log('✅ Bot Engine Status: Active!');
    botStatus = 'ready';
    latestQrImage = ''; 
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
            if (data.choices && data.choices[0].message) {
                await message.reply(data.choices[0].message.content);
            }
        } catch (error) {
            console.error("AI Node Processing failure:", error);
        }
    }
});

client.initialize();

// Professional Custom Dashboard HTML Route
app.get('/', (req, res) => {
    let mainContent = '';
    
    if (botStatus === 'ready') {
        mainContent = `
            <div style="background:#e7f8ee; color:#1c7c44; border:1px solid #c3ebd4; padding:20px; border-radius:8px; font-weight:bold;">
                🎉 WhatsApp Session Initialized! Bot is Active and Running 24/7.
            </div>
            <p style="margin-top:15px; color:#666;">You can now safely turn off your mobile internet or close this page.</p>
        `;
    } else if (latestQrImage) {
        mainContent = `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #fff;">
                <img src="${latestQrImage}" alt="WhatsApp QR Code" style="max-width: 100%; height: auto; border: 1px solid #eee;" />
            </div>
            <p style="font-size:12px; color:#718096; margin-top:10px;">If code expires, simply refresh this webpage.</p>
        `;
    } else {
        mainContent = `
            <div style="padding: 40px 20px; color:#a0aec0;">
                <div style="font-size: 24px; margin-bottom: 15px;">🔄</div>
                WhatsApp session initializing... Please wait 10 seconds and refresh the browser.
            </div>
        `;
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WhatsApp Bot Dashboard</title>
            <style>
                body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; background:#f7fafc; margin:0; padding:20px; display:flex; justify-content:center; }
                .container { max-width: 480px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); padding: 24px; box-sizing: border-box; }
                .header { font-size: 14px; color: #a0aec0; margin-bottom: 5px; text-align: left; font-weight: 5px; }
                .connected-count { font-size: 13px; color: #718096; border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px; text-align: left; }
                .title-bar { font-size: 18px; font-weight: bold; color: #1a202c; margin-bottom: 20px; text-align: left; }
                .tabs-row { display: flex; border-bottom: 2px solid #edf2f7; margin-bottom: 25px; }
                .tab { padding: 10px 15px; font-size: 14px; font-weight: 600; color: #4a5568; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
                .tab.active { color: #00b074; border-bottom-color: #00b074; }
                .btn-connect { display: block; width: 100%; background: #00b074; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 20px; text-align: center; text-decoration: none; box-shadow: 0 4px 12px rgba(0,176,116,0.2); }
                .instructions { text-align: left; margin-top: 25px; background: #f7fafc; padding: 15px; border-radius: 10px; font-size: 13px; color: #4a5568; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Oct 14, 2026</div>
                <div class="connected-count">${botStatus === 'ready' ? '1 device connected' : '0 devices connected'}</div>
                
                <div class="title-bar">📱 Device Connection</div>
                
                <div class="tabs-row">
                    <div class="tab active">QR Code</div>
                    <div class="tab" style="color:#a0aec0; cursor:not-allowed;">Pairing Code</div>
                    <div class="tab" style="color:#a0aec0; cursor:not-allowed;">Linked Devices</div>
                </div>

                ${mainContent}

                ${botStatus === 'disconnected' ? '<button class="btn-connect" onclick="window.location.reload()">🔄 Connect WhatsApp</button>' : ''}

                <div class="instructions">
                    <strong>📋 How to connect?</strong><br>
                    1. Open WhatsApp on your primary phone.<br>
                    2. Go to Settings > Linked Devices.<br>
                    3. Tap <strong>Link a Device</strong> and scan the layout block graphic above.
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(port, () => console.log(`Server serving dashboard layout matrix on port ${port}`));
