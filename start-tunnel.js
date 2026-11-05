/**
 * Avtomatik Cloudflare Tunnel va Telegram Mini App sinxronizatori.
 * Bu skript local test vaqtida cloudflared tunnelini ishga tushiradi
 * va hosil bo'lgan HTTPS manzilni backend/.env faylidagi FRONTEND_URL ga
 * avtomatik yozib qo'yadi.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLOUDFLARED_BIN = path.join(__dirname, 'cloudflared.exe');
const ENV_PATH = path.join(__dirname, 'backend', '.env');
const FRONTEND_PORT = 5174; // Agar 5173 bo'lsa, o'zgartirishingiz mumkin

if (!fs.existsSync(CLOUDFLARED_BIN)) {
  console.error('❌ cloudflared.exe fayli topilmadi!');
  process.exit(1);
}

console.log('🚀 Cloudflare tunnel ishga tushirilmoqda...');
const tunnel = spawn(CLOUDFLARED_BIN, ['tunnel', '--url', `http://127.0.0.1:${FRONTEND_PORT}`], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let urlFound = false;

function handleOutput(data) {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match && !urlFound) {
    urlFound = true;
    const tunnelUrl = match[0];
    console.log(`\n==================================================`);
    console.log(`✅ Cloudflare Tunnel muvaffaqiyatli ishga tushdi!`);
    console.log(`🌐 Doimiy HTTPS Manzil: ${tunnelUrl}`);
    console.log(`📱 Telegram Mini App URL: ${tunnelUrl}/location-picker`);
    console.log(`==================================================\n`);

    // backend/.env ni yangilash
    if (fs.existsSync(ENV_PATH)) {
      let envContent = fs.readFileSync(ENV_PATH, 'utf-8');
      if (envContent.includes('FRONTEND_URL=')) {
        envContent = envContent.replace(/FRONTEND_URL=.*/, `FRONTEND_URL=${tunnelUrl}`);
      } else {
        envContent += `\nFRONTEND_URL=${tunnelUrl}\n`;
      }
      fs.writeFileSync(ENV_PATH, envContent, 'utf-8');
      console.log(`📝 backend/.env faylidagi FRONTEND_URL avtomatik yangilandi!`);
      console.log(`💡 Endi Telegram botingizda "🗺 Xaritadan belgilash (Mini App)" 100% ishlaydi.\n`);
    }
  }
}

tunnel.stdout.on('data', handleOutput);
tunnel.stderr.on('data', handleOutput);

tunnel.on('close', (code) => {
  console.log(`\n⚠️ Cloudflare tunnel to'xtatildi (kod: ${code}).`);
});

process.on('SIGINT', () => {
  tunnel.kill();
  process.exit();
});
