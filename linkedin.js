const fs = require("fs");
const puppeteer = require("puppeteer");
const readline = require("readline");
require("dotenv").config();

const COOKIE_FILE = "linkedin_cookies.json";

function waitForEnter() {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question("📲 Complete SMS verification in browser, then press ENTER to continue...", () => {
            rl.close();
            resolve();
        });
    });
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight > 2500) {
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
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // LOGIN FLOW
    let loggedIn = false;

    if (fs.existsSync(COOKIE_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE));
        await page.setCookie(...cookies);
        console.log("🍪 Cookies loaded. Checking session...");

        await page.goto("https://www.linkedin.com/feed/", { waitUntil: "load", timeout: 0 });
        const stillLoggedOut = await page.$('input[name="session_key"]');

        if (!stillLoggedOut) {
            console.log("✅ Session valid. Logged in with cookies.");
            loggedIn = true;
        } else {
            console.log("⚠️ Session expired. Re-authenticating...");
        }
    }

    if (!loggedIn) {
        await page.goto("https://www.linkedin.com/login", { waitUntil: "load", timeout: 0 });

        const isCheckpoint = await page.$('input[name="session_password"]') !== null &&
            (await page.$('input[name="session_key"]')) === null;

        if (isCheckpoint) {
            await page.type('input[name="session_password"]', process.env.LINKEDIN_PASSWORD);
            await Promise.all([
                page.click('[type="submit"]'),
                page.waitForNavigation({ waitUntil: "load" }),
            ]);
            console.log("🔐 Logged in via checkpoint.");
        } else {
            await page.type('input[name="session_key"]', process.env.LINKEDIN_EMAIL);
            await page.type('input[name="session_password"]', process.env.LINKEDIN_PASSWORD);
            await Promise.all([
                page.click('[type="submit"]'),
                page.waitForNavigation({ waitUntil: "load" }),
            ]);
            console.log("🔐 Logged in via full login page.");
        }

        console.log("🚨 If LinkedIn asks for SMS code, complete it in browser.");
        await waitForEnter();

        const cookies = await page.cookies();
        fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
        console.log("✅ New cookies saved.");
    }

    // Go to recent activity
    await page.goto("https://www.linkedin.com/in/saymanlal/recent-activity/all", {
        waitUntil: "load",
        timeout: 0
    });

    await autoScroll(page);
    await new Promise(res => setTimeout(res, 5000));

    const result = await page.evaluate(() => {
        const postEl = document.querySelector('.feed-shared-update-v2') ||
            document.querySelector('[data-id*="urn:li:activity"]');

        const textEl = postEl?.querySelector('.update-components-text') ||
            postEl?.querySelector('[data-urn*="urn:li:activity"]');

        const text = textEl?.innerText?.trim() || null;

        return { text };
    });

    // Append fixed LinkedIn profile link
    const finalText = result.text
        ? `${result.text.trim()}\n\n🌐 My LinkedIn profile: https://www.linkedin.com/in/saymanlal`
        : null;

    console.log("📝 Final Text with Profile Link:\n");
    console.log(finalText || "⚠️ No post found.");

    await browser.close();

    return { text: finalText };
}

module.exports = linkedin;
