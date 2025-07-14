const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;

async function x(status) {
  let tweetText = status.length > 280 ? status.slice(0, 277) + "..." : status;

  try {
    const res = await rwClient.v2.tweet({ text: tweetText });  // ✅ v2 API used here
    console.log("✅ Posted to X via v2:", res.data.id);
  } catch (err) {
    console.error("❌ X post failed (v2):", err.message || err);
  }
}

module.exports = x;
