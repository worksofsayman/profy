const fs = require('fs');
const puppeteer = require('puppeteer');
const readline = require('readline');
require('dotenv').config();

const COOKIE_FILE = 'linkedin_cookies.json';

function waitForEnter() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('📲 Complete SMS verification in browser, then press ENTER to continue...', () => {
      rl.close();
      resolve();
    });
  });
}

async function linkedin() {
  const browser = await puppeteer.launch({
    headless: false, // so you can enter SMS manually
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 🍪 Try to load saved cookies
  if (fs.existsSync(COOKIE_FILE)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE));
    await page.setCookie(...cookies);
    console.log("🍪 Cookies loaded. Skipping login...");
  } else {
    // 👤 Manual login with SMS
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
    await page.type('#username', process.env.LINKEDIN_EMAIL);
    await page.type('#password', process.env.LINKEDIN_PASSWORD);
    await Promise.all([
      page.click('[type=submit]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log("🚨 If LinkedIn asks for SMS code, complete it in browser.");

    await waitForEnter();

    // ✅ Save cookies after first login
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
    console.log("✅ Cookies saved.");
  }

  // 🔎 Go to profile to fetch posts
  await page.goto(process.env.LINKEDIN_PROFILE_URL, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 5000)); // wait extra for full load

  const result = await page.evaluate(() => {
    const postEl = document.querySelector('.feed-shared-update-v2') ||
                   document.querySelector('[data-id*="urn:li:activity"]');

    if (!postEl) return { text: null, imageUrl: null };

    const text = postEl.innerText?.trim() || null;
    const imgEl = postEl.querySelector('img');
    const imageUrl = imgEl?.src || null;

    return { text, imageUrl };
  });

  await browser.close();
  return result;
}

module.exports = linkedin;
