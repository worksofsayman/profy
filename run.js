const linkedin = require('./linkedin');
const x = require('./x');
const { isNewPost, cachePost } = require('./repost');
const cleanPost = require('./format');

// Define your profile URL once here
const PROFILE_URL = "https://www.linkedin.com/in/saymanlal";

async function run() {
  console.log("🔍 Scraping LinkedIn...");
  const { text } = await linkedin(); // no postUrl anymore

  if (!text) {
    console.log("⚠️ No post found.");
    return;
  }

  const formattedText = cleanPost(text);

  // Append profile URL to the end manually
  const finalText = `${formattedText}\n\n🌐 My LinkedIn profile: ${PROFILE_URL}`;

  if (isNewPost(finalText, PROFILE_URL)) {
    console.log("Latest Post:", finalText.slice(0, 100) + "...");
    console.log("Posting to X...");

    await x(finalText); // you can also pass finalText only
    cachePost(finalText, PROFILE_URL);

    console.log("✅ Posted & cached.");
  } else {
    console.log("⚠️ Already posted. Skipping.");
  }
}

run();
