const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const app = express();

let qrData = null;
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox'] }
});

client.on('qr', async (qr) => {
  qrData = await QRCode.toDataURL(qr);
  console.log('QR READY');
});

client.on('ready', () => {
  isReady = true;
  console.log('READY DA!');
});

client.on('message', async (msg) => {
  if(msg.fromMe) return;
  const t = msg.body.toLowerCase();
  const o = msg.body;
  let r = '';

  if(t.includes('hi')) r = 'Hi da! Naan Hari AI! Bill, QR, Photo ellam mudiyum!';
  else if(t.includes('bill')){
    const amt = o.match(/\d+/)?.[0]||'1000';
    r = `BILL: Rs.${amt} + GST = Rs.${Math.floor(amt*1.18)} - Hari Store`;
  } else if(t.includes('qr')) r = `QR: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${o}`;
  else r = `HARI AI: Nee sonna ${o} - Help pannuven da!`;

  await client.sendMessage(msg.from, r);
});

client.initialize();

app.get('/', (req,res)=>{
  if(isReady) res.send('<h1 style="text-align:center;padding:50px;background:#000;color:#0f0">✅ WHATSAPP AI CONNECTED!<br>Yaar msg anupinaalum reply varum!</h1>');
  else if(qrData) res.send(`<body style="background:#000;color:#fff;text-align:center;padding:20px"><h2 style="color:#0f0">SCAN QR - WhatsApp Linked Devices</h2><img src="${qrData}" style="width:300px;background:#fff;padding:10px"/><script>setTimeout(()=>location.reload(),5000)</script></body>`);
  else res.send('<h2>Loading QR... refresh 3 sec</h2><script>setTimeout(()=>location.reload(),3000)</script>');
});

app.listen(process.env.PORT||3000);
