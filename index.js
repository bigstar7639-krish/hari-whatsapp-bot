const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const express = require('express');
const fetch = require('node-fetch');
const QRCodeLib = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

let latestQrImage = '';
let pairingCode = ''; 
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

// Forcing WhatsApp Web to load the Text-based Pairing screen immediately in backend
client.on('qr', async (qr) => {
    qrcodeTerminal.generate(qr, { small: true });
    botStatus = 'disconnected';
    
    try {
        latestQrImage = await QRCodeLib.toDataURL(qr);
        
        // Waiting for the page layer to fully load before clicking the link number mode
        if (client.pupPage) {
            await new Promise(r => setTimeout(r, 8000)); 
            
            pairingCode = await client.pupPage.evaluate(async () => {
                // Find and click the native 'Link with phone number instead' hidden button
                const spans = Array.from(document.querySelectorAll('span'));
                const linkText = spans.find(el => el.textContent.includes('Link with phone number instead') || el.textContent.includes('Link with phone number'));
                if (linkText) {
                    linkText.click();
                    await new Promise(r => setTimeout(r, 4000));
                    
                    // Fetch the generated 8-character string boxes
                    const codeElements = Array.from(document.querySelectorAll('[data-ref]'));
                    if (codeElements.length > 0) {
                        return codeElements.map(el => el.getAttribute('data-ref')).join('');
                    }
                    
                    // Fallback to reading raw elements inside the code grid block
                    const mainBox = document.querySelector('div[dir="ltr"]');
                    if (mainBox && mainBox.textContent.length >= 8) {
                        return mainBox.textContent.substring(0, 8);
                    }
                }
                return '';
            });
            
            if (pairingCode) {
                console.log('👉 GENERATED PAIRING CODE:', pairingCode);
            }
        }
    } catch (err) {
        console.error('Pairing Code Script Error:', err);
    }
});

client.on('ready', () => {
    console.log('✅ Bot Engine Status: Active!');
    botStatus = 'ready';
    latestQrImage = ''; 
    pairingCode = '';
