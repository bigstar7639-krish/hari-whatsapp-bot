let latestQrImage = '';

client.on('qr', async (qr) => {
    // Generates a clean terminal backup log
    qrcode.generate(qr, { small: true });
    
    // Generates a clean URL image link for mobile viewing
    const QRCodeLib = require('qrcode');
    try {
        latestQrImage = await QRCodeLib.toDataURL(qr);
        console.log('👉 Mobile Scan Link: Open your primary URL in a web browser tab to view your QR code!');
    } catch (err) {
        console.error('Failed to generate image URL data string', err);
    }
});

// Update the app.get web controller down at the bottom of index.js (around line 72) to match this:
app.get('/', (req, res) => {
    if (latestQrImage) {
        res.send(`
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f0f2f5;font-family:sans-serif}</style>
            <h2>Scan this QR code with WhatsApp</h2>
            <img src="${latestQrImage}" style="border:16px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.1); border-radius:8px;" />
            <p style="margin-top:16px;color:#666;">Refresh the web page if the code expires or disappears.</p>
        `);
    } else {
        res.send('<h3>Bot Status: Active</h3><p>If you are trying to link your account, wait a moment and refresh this page.</p>');
    }
});
