const { By } = require("selenium-webdriver");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const translateToEnglish = require("../utils/translator");

async function runElPaisTest(driver) {

    await driver.get("https://elpais.com/");
    await driver.sleep(4000);

    // Accept cookies
    try {
        let btn = await driver.findElement(By.css('button[aria-label="Aceptar"]'));
        await btn.click();
    } catch {}

    await driver.get("https://elpais.com/opinion/");
    await driver.sleep(5000);

    let articles = await driver.findElements(By.css("article h2 a"));

    let links = [];
    for (let i = 0; i < Math.min(5, articles.length); i++) {
        links.push(await articles[i].getAttribute("href"));
    }

    console.log("Fetched Links:", links.length);

    let spanishTitles = [];
    let englishTitles = [];

    for (let i = 0; i < links.length; i++) {

        await driver.get(links[i]);
        await driver.sleep(4000);

        let title = "Title not found";
        try {
            let el = await driver.findElement(By.css("h1"));
            title = await el.getText();
        } catch {}

        console.log("Spanish:", title);
        spanishTitles.push(title);

        let translated = await translateToEnglish(title);
        englishTitles.push(translated);

        console.log("English:", translated);

        // image download (optional in cloud but keeps logic)
        try {
            let img = await driver.findElement(By.css("figure img"));
            let imgUrl = await img.getAttribute("src");

            await fs.ensureDir("images");
            let imgPath = path.join("images", `cloud_article${i + 1}.jpg`);
            let response = await axios({ url: imgUrl, responseType: "arraybuffer" });

            await fs.writeFile(imgPath, response.data);
        } catch {}
    }

    // word frequency
    let combined = englishTitles.join(" ").toLowerCase().replace(/[^\w\s]/g, "");
    let words = combined.split(/\s+/);
    let freq = {};

    for (let w of words) {
        if (w.length < 3) continue;
        freq[w] = (freq[w] || 0) + 1;
    }

    console.log("\nRepeated Words:");
    for (let w in freq) {
        if (freq[w] > 2) console.log(w, freq[w]);
    }
}

module.exports = runElPaisTest;
