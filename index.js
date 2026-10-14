const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');
const QRCodeLib = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

let latestQrImage = '';
let pairingCode = ''; // Stores the 8-digit text code
let botStatus = 'disconnected'; 

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
        
        // This golden line requests the 8-digit numeric pairing code from WhatsApp Web engine!
        if (client.pupPage) {
            // Wait for internal structural elements to settle
            await new Promise(r => setTimeout(r, 5000)); 
            
            // Checks if code generation elements exist in WhatsApp backend page
            pairingCode = await client.pupPage.evaluate(async () => {
                const buttons = Array.from(document.querySelectorAll('span'));
                const linkButton = buttons.find(el => el.textContent.includes('Link with phone number instead') || el.textContent.includes('Link with phone number'));
                if (linkButton) {
                    linkButton.click();
                    await new Promise(r => setTimeout(r, 3000));
                    const codeContainer = document.querySelector('[data-ref]');
                    return codeContainer ? codeContainer.getAttribute('data-ref') : '';
                }
                return '';
            });
        }
    } catch (err) {
        console.error('QR/Pairing Generation Failure:', err);
    }
});

client.on('ready', () => {
    console.log('✅ Bot Engine Status: Active!');
    botStatus = 'ready';
    latestQrImage = ''; 
    pairingCode = '';
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
            console.error("AI Core processing error:", error);
        }
    }
});

client.initialize();

// Updated Custom Dashboard Layout to support Text-based Pairing Key code
app.get('/', (req, res) => {
    let mainContent = '';
    
    if (botStatus === 'ready') {
        mainContent = `
            <div style="background:#e7f8ee; color:#1c7c44; border:1px solid #c3ebd4; padding:20px; border-radius:8px; font-weight:bold;">
                🎉 WhatsApp Session Initialized! Bot is Active and Running 24/7.
            </div>
        `;
    } else if (pairingCode) {
        mainContent = `
            <div style="border: 2px dashed #00b074; border-radius: 12px; padding: 25px; background: #f0fdf4; text-align:center; margin: 15px 0;">
                <span style="font-size: 14px; color:#4a5568; display:block; margin-bottom:8px; font-weight:600;">YOUR 8-DIGIT PAIRING CODE:</span>
                <span style="font-size: 32px; font-weight: bold; color: #00b074; letter-spacing: 4px; font-family:monospace;">${pairingCode}</span>
            </div>
            <p style="font-size:12px; color:#718096;">Enter this exact code on your phone's WhatsApp linkage popup screen.</p>
        `;
    } else if (latestQrImage) {
        mainContent = `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #fff; text-align:center;">
                <img src="${latestQrImage}" alt="WhatsApp QR Code" style="max-width: 100%; height: auto;" />
                <p style="font-size:13px; color:#ff9800; font-weight:bold; margin-top:15px;">⚠️ Single Phone Shortcut: Wait 10 seconds for the engine to fetch the textual Pairing Code instead!</p>
            </div>
        `;
    } else {
        mainContent = `
            <div style="padding: 40px 20px; color:#a0aec0; text-align:center;">
                <div style="font-size: 24px; margin-bottom: 15px;">🔄</div>
                Initializing cloud browser matrix... Wait 15 seconds and refresh this tab.
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
                .header { font-size: 14px; color: #a0aec0; margin-bottom: 5px; text-align: left; }
                .connected-count { font-size: 13px; color: #718096; border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px; text-align: left; }
                .title-bar { font-size: 18px; font-weight: bold; color: #1a202c; margin-bottom: 20px; text-align: left; }
                .tabs-row { display: flex; border-bottom: 2px solid #edf2f7; margin-bottom: 25px; }
                .tab { padding: 10px 15px; font-size: 14px; font-weight: 600; color: #a0aec0; }
                .tab.active { color: #00b074; border-bottom: 2px solid #00b074; margin-bottom: -2px; }
                .btn-connect { display: block; width: 100%; background: #00b074; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 20px; text-align: center; text-decoration: none; }
                .instructions { text-align: left; margin-top: 25px; background: #f7fafc; padding: 15px; border-radius: 10px; font-size: 13px; color: #4a5568; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Live Operations Console</div>
                <div class="connected-count">${botStatus === 'ready' ? '1 device active' : '0 devices active'}</div>
                
                <div class="title-bar">📱 Single-Device Link Setup</div>
                
                <div class="tabs-row">
                    <div class="tab active">Pairing Code Mode</div>
                </div>

                ${mainContent}

                <button class="btn-connect" onclick="window.location.reload()">🔄 Refresh Dashboard</button>

                <div class="instructions">
                    <strong>📋 Link Step-by-Step:</strong><br>
                    1. On WhatsApp split screen, click <strong>"Link with phone number instead"</strong>.<br>
                    2. Type the 8-character alphabetic/numeric token code shown on this page dashboard green box.<br>
                    3. Connection processes instantly!
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(port, () => console.log(`Matrix console operational on endpoint port ${port}`));
