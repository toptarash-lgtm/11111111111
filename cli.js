'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const DATA_DIR = process.env.DATA_DIR || '/var/lib/batman-license';
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SECRET_FILE = path.join(DATA_DIR, 'hmac.secret');

function hashPassword(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pass, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(q, ans => { rl.close(); resolve(ans); }));
}

function loadData() {
  let data = { version: 2, admin: { username: 'admin', passHash: '' }, licenses: [], settings: { brandTitle: 'Batman License Manager' } };
  if (fs.existsSync(DB_FILE)) {
    try { data = Object.assign(data, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch {}
  }
  return data;
}

function ensureSecret() {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(SECRET_FILE)) {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
    console.log('✓ کلید امضای HMAC ساخته شد (' + SECRET_FILE + ')');
  }
}

// --- حالت تعاملی: برای نصب روی VPS (همان رفتار قبلی، بدون تغییر) ---
async function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  const data = loadData();

  console.log('=== راه‌اندازی پنل مدیریت لایسنس Batman ===\n');
  const user = (await ask('نام کاربری ادمین [' + (data.admin.username || 'admin') + ']: ')).trim() || data.admin.username || 'admin';
  let pass = '';
  while (pass.length < 8) {
    pass = await ask('رمز عبور (حداقل ۸ کاراکتر): ');
    if (pass.length < 8) console.log('رمز کوتاه است.');
  }

  data.admin.username = user;
  data.admin.passHash = hashPassword(pass);
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  ensureSecret();

  console.log('\n✓ ادمین ساخته شد.');
  console.log('  فایل دیتابیس:', DB_FILE);
  console.log('  حالا سرویس را استارت کنید یا: node server.js');
}

// --- حالت غیرتعاملی: برای پلتفرم‌هایی مثل Suga/Render که ترمینال تعاملی ندارن ---
// فقط وقتی واقعاً کاری انجام می‌دهد که هنوز هیچ ادمینی ساخته نشده باشد (passHash خالی).
// در دیپلوی‌های بعدی چیزی را بازنویسی نمی‌کند، پس امن است که هر بار موقع استارت اجرا شود.
function initIfNeeded() {
  const data = loadData();
  if (data.admin && data.admin.passHash) {
    console.log('✓ ادمین از قبل ساخته شده، این مرحله رد شد.');
    ensureSecret();
    return;
  }

  const user = process.env.ADMIN_USERNAME || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';

  if (!pass || pass.length < 8) {
    console.error('✗ متغیر محیطی ADMIN_PASSWORD تنظیم نشده یا کمتر از ۸ کاراکتر است.');
    console.error('  در تنظیمات محیط (Environment Variables) پلتفرم، ADMIN_PASSWORD (و اختیاری ADMIN_USERNAME) را اضافه کن.');
    process.exit(1);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  data.admin = data.admin || {};
  data.admin.username = user;
  data.admin.passHash = hashPassword(pass);
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  ensureSecret();

  console.log('✓ ادمین اولیه ساخته شد. نام کاربری:', user);
}

const cmd = process.argv[2];
if (cmd === 'init') init().catch(e => { console.error(e); process.exit(1); });
else if (cmd === 'init-if-needed') initIfNeeded();
else {
  console.log('استفاده:');
  console.log('  node cli.js init            (تعاملی — برای VPS)');
  console.log('  node cli.js init-if-needed  (غیرتعاملی — برای Suga/Render، از ENV می‌خواند)');
  process.exit(1);
}
