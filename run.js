const linkedin = require('./linkedin');
const x = require('./x');
const { isNewPost, cachePost } = require('./repost');
const cleanPost = require('./format');

async function run() {
  console.log("🔍 Scraping LinkedIn...");
  const { text, imageUrl } = await linkedin();

  if (!text) {
    console.log("⚠️ No post found.");
    return;
  }

  const formattedText = cleanPost(text);

  if (isNewPost(formattedText, imageUrl)) {
    console.log("Latest Post:", formattedText.slice(0, 100) + "...");
    console.log("Posting to X...");

    await x(formattedText, imageUrl);
    cachePost(formattedText, imageUrl);

    console.log("Posted & cached.");
  } else {
    console.log("⚠️ Already posted. Skipping.");
  }
}

run();
