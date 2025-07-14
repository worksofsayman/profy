function format(text) {
    if (!text) 
     return "";
    text = text.replace(/See more/gi, "");
    text = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, "");
    text = text.replace(/https?:\/\/\S+/g, "");
    text = text.replace(/#[^\s#]+/g, "");
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }
  
  module.exports = format;
  