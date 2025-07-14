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

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight > 1500) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function linkedin() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    if (fs.existsSync(COOKIE_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE));
        await page.setCookie(...cookies);
        console.log("🍪 Cookies loaded. Skipping login...");
    } else {
        // 👤 First-time login to LinkedIn
        await page.goto('https://www.linkedin.com/login', {
            waitUntil: 'load',
            timeout: 0,
        });

        await page.type('#username', process.env.LINKEDIN_EMAIL);
        await page.type('#password', process.env.LINKEDIN_PASSWORD);

        await Promise.all([
            page.click('[type=submit]'),
            page.waitForNavigation({ waitUntil: 'load' }),
        ]);

        console.log("🚨 If LinkedIn asks for SMS code, complete it in browser.");
        await waitForEnter();

        // ✅ Save cookies after login
        const cookies = await page.cookies();
        fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
        console.log("✅ Cookies saved.");
    }

    // 🔍 Go to profile to scrape latest post
    await page.goto(process.env.LINKEDIN_PROFILE_URL, {
        waitUntil: 'load',
        timeout: 0,
    });

    await autoScroll(page);
    await new Promise(resolve => setTimeout(resolve, 3000)); // wait for feed to settle

    const result = await page.evaluate(() => {
        const postEl = document.querySelector('.feed-shared-update-v2') ||
            document.querySelector('[data-id*="urn:li:activity"]');

        if (!postEl) return { text: null, imageUrl: null };

        const text = postEl.innerText?.trim() || null;

        const imgEl = Array.from(postEl.querySelectorAll('img')).find(
            img => !img.src.includes('profile-displayphoto') &&
                !img.src.includes('emoji') &&
                img.naturalWidth > 100
        );

        const imageUrl = imgEl?.src || null;

        return { text, imageUrl };
    });


    // ✅ Add logging here:
    console.log("📝 Scraped Post Text (trimmed):", result.text?.slice(0, 200));
    console.log("🖼️ Scraped Image URL:", result.imageUrl || "No image found");

    await browser.close();
    return result;

}

module.exports = linkedin;
