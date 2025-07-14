const puppeteer = require('puppeteer');
require('dotenv').config();

async function linkedin() {
  const browser = await puppeteer.launch({
    headless: false,  // Set false for debugging (see browser actions)
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Login to LinkedIn
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
  await page.type('#username', process.env.LINKEDIN_EMAIL);
  await page.type('#password', process.env.LINKEDIN_PASSWORD);
  await Promise.all([
    page.click('[type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // Optional: Debug screenshot after login
  await page.screenshot({ path: 'after-login.png' });

  // Check if login failed (captcha, incorrect login, 2FA page, etc.)
  const loginError = await page.$('.form__label--error');
  if (loginError) {
    console.log("❌ Login failed.");
    await browser.close();
    return { text: null, imageUrl: null };
  }

  // Go to your profile
  await page.goto(process.env.LINKEDIN_PROFILE_URL, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(5000); // extra time for feed to render

  // Use broader selector and check fallback
  const post = await page.evaluate(() => {
    const postEl = document.querySelector('.feed-shared-update-v2')
      || document.querySelector('[data-id*="urn:li:activity"]');

    if (!postEl) return { text: null, imageUrl: null };

    const text = postEl.innerText?.trim() || null;

    const imgEl = postEl.querySelector('img');
    const imageUrl = imgEl?.src || null;

    return { text, imageUrl };
  });

  await page.close();
  await browser.close();

  return post;
}

module.exports = linkedin;
