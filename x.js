const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Twitter = require("twitter-lite");
require("dotenv").config();

const client = new Twitter({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
});

async function downloadImage(url, filename = "temp-image.jpg") {
  const response = await axios({
    url,
    responseType: "arraybuffer",
  });

  const filePath = path.resolve(__dirname, filename);
  fs.writeFileSync(filePath, response.data);
  return filePath;
}

async function x(status, imageUrl = null) {
  try {
    const tweet = status.length > 280 ? status.slice(0, 276) + "..." : status;

    let mediaId = null;
    if (imageUrl) {
      const imagePath = await downloadImage(imageUrl);
      const mediaData = fs.readFileSync(imagePath);
      const media = await client.post("media/upload", {
        media: mediaData,
      });
      mediaId = media.media_id_string;
      fs.unlinkSync(imagePath);
    }

    const params = {
      status: tweet,
      ...(mediaId && { media_ids: mediaId }),
    };

    const response = await client.post("statuses/update", params);
    console.log("Posted to X:", response.text);
  } catch (error) {
    console.error("Failed to post to X:", error);
  }
}

module.exports = x;
