const axios = require("axios");

async function translateToEnglish(text) {
    try {
        const response = await axios.get(
            "https://api.mymemory.translated.net/get",
            {
                params: {
                    q: text,
                    langpair: "es|en"
                }
            }
        );

        return response.data.responseData.translatedText;

    } catch (error) {
        console.log("Translation API error:", error.message);
        return "Translation failed";
    }
}

module.exports = translateToEnglish;
