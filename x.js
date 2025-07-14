const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function downloadImage(url, filename = "temp-image.jpg") {
  try {
    console.log("🖼️ Downloading and compressing image:", url);
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const filePath = path.resolve(__dirname, filename);
    fs.writeFileSync(filePath, response.data);
    return filePath;
  } catch (err) {
    console.error("❌ Failed to download image:", err.message);
    return null;
  }
}

async function x(status, imageUrl = null) {
  try {
    const tweet = status.length > 280 ? status.slice(0, 276) + "..." : status;

    let mediaId = null;
    if (imageUrl) {
      const imagePath = await downloadImage(imageUrl);
      if (imagePath) {
        const mediaData = fs.readFileSync(imagePath);
        console.log("📤 Uploading image to X...");
        const media = await twitterClient.v1.uploadMedia(mediaData, { mimeType: "image/jpeg" });
        mediaId = media;
        fs.unlinkSync(imagePath);
      }
    }

    const tweetParams = {
      status: tweet,
      ...(mediaId && { media_ids: [mediaId] }),
    };

    const response = await twitterClient.v1.tweet(tweetParams.status, {
      media_ids: mediaId ? [mediaId] : undefined,
    });

    console.log("✅ Successfully posted to X:", response.id_str);
  } catch (error) {
    console.error("❌ Final X post failed:", error.message || error);
  }
}

module.exports = x;