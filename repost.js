const fs = require("fs");
const crypto = require("crypto");

const CACHE_FILE = "repost.json";

function getHash(text, imageUrl) {
  const combined = text + (imageUrl || "");
  return crypto.createHash("sha256").update(combined).digest("hex");
}

function isNewPost(text, imageUrl) {
  const hash = getHash(text, imageUrl);
  if (!fs.existsSync(CACHE_FILE)) return true;

  const cached = JSON.parse(fs.readFileSync(CACHE_FILE));
  return cached.lastHash !== hash;
}

function cachePost(text, imageUrl) {
  const hash = getHash(text, imageUrl);
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ lastHash: hash }));
}

module.exports = { isNewPost, cachePost };
