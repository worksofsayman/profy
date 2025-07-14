const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;

const PROFILE_URL = "https://www.linkedin.com/in/saymanlal";

function summarize(text, maxLength = 200) {
  return text.length > maxLength ? text.slice(0, maxLength - 3) + "..." : text;
}

async function x(status) {
  const tweetText = summarize(status, 200);
  const final = `${tweetText}\n🌐 My LinkedIn profile: ${PROFILE_URL}`;

  try {
    const res = await rwClient.v2.tweet({ text: final });
    console.log("✅ Posted to X via v2:", res.data.id);
  } catch (err) {
    console.error("❌ X post failed:", err.message || err);
  }
}

module.exports = x;
