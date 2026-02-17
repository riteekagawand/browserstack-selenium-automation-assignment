require("dotenv").config();
const { Builder, By } = require("selenium-webdriver");
const translateToEnglish = require("../utils/translator");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function start() {
    let driver = await new Builder().forBrowser("chrome").build();

    try {
        // 1️⃣ Open homepage
        await driver.get("https://elpais.com/");
        await driver.sleep(4000);

        // 2️⃣ Accept cookies
        try {
            let btn = await driver.findElement(By.css('button[aria-label="Aceptar"]'));
            await btn.click();
            console.log("Cookies accepted");
        } catch {
            console.log("No cookie popup");
        }

        await driver.sleep(2000);

        // 3️⃣ Go to Opinion section
        await driver.get("https://elpais.com/opinion/");
        await driver.sleep(5000);
        console.log("Opinion page opened");

        // 4️⃣ Get first 5 article links
        let articles = await driver.findElements(By.css("article h2 a"));

        let links = [];
        for (let i = 0; i < Math.min(5, articles.length); i++) {
            let href = await articles[i].getAttribute("href");
            links.push(href);
        }

        console.log("First 5 Article Links:");
        console.log(links);

        let spanishTitles = [];
        let englishTitles = [];

        // create images folder
        await fs.ensureDir("images");

        // 5️⃣ Open each article
        for (let i = 0; i < links.length; i++) {
            console.log(`\n==============================`);
            console.log(`Opening Article ${i + 1}`);

            try {
                await driver.get(links[i]);
                await driver.sleep(4000);

                // ---------- TITLE ----------
                let title = "";
                try {
                    let titleEl = await driver.wait(
                        async () => {
                            let el = await driver.findElement(By.css("h1"));
                            let txt = await el.getText();
                            return txt.length > 5 ? el : false;
                        },
                        15000
                    );
                    title = await titleEl.getText();
                } catch {
                    title = "Title not found";
                }

                console.log("Title (Spanish):", title);
                spanishTitles.push(title);

                // ---------- CONTENT ----------
                await driver.sleep(3000);

                let content = "";
                let selectors = [
                    "div[data-dtm-region='articulo_cuerpo'] p",
                    "article p",
                    ".a_c p",
                    ".articulo-cuerpo p"
                ];

                for (let selector of selectors) {
                    let paragraphs = await driver.findElements(By.css(selector));

                    if (paragraphs.length > 3) {
                        for (let p of paragraphs) {
                            let text = await p.getText();
                            if (text.trim().length > 40) {
                                content += text + "\n";
                            }
                        }
                        if (content.length > 200) break;
                    }
                }

                if (content.length === 0) {
                    content = "Content not found (different article format)";
                }

                console.log("Content Preview:", content.substring(0, 300), "...\n");

                // ---------- IMAGE DOWNLOAD ----------
                try {
                    let img = await driver.findElement(By.css("figure img"));
                    let imgUrl = await img.getAttribute("src");

                    let imgPath = path.join("images", `article${i + 1}.jpg`);
                    let response = await axios({
                        url: imgUrl,
                        responseType: "arraybuffer"
                    });

                    await fs.writeFile(imgPath, response.data);
                    console.log("Image saved:", imgPath);
                } catch {
                    console.log("No image found");
                }

            } catch (err) {
                console.log("Error reading article:", err.message);
            }
        }

        // ================= TRANSLATION =================
        console.log("\nTranslating Titles...\n");

        for (let t of spanishTitles) {
            let translated = await translateToEnglish(t);
            englishTitles.push(translated);
            console.log("EN:", translated);
        }

        // ================= WORD FREQUENCY ANALYSIS =================
        console.log("\nRepeated Words (more than 2 times):\n");

        let combinedText = englishTitles.join(" ").toLowerCase();
        combinedText = combinedText.replace(/[^\w\s]/g, "");

        let words = combinedText.split(/\s+/);
        let freq = {};

        for (let word of words) {
            if (word.length < 3) continue;
            freq[word] = (freq[word] || 0) + 1;
        }

        let repeated = false;
        for (let word in freq) {
            if (freq[word] > 2) {
                console.log(`${word} → ${freq[word]} times`);
                repeated = true;
            }
        }

        if (!repeated) {
            console.log("No words repeated more than 2 times.\n");
            console.log("Top occurring words:");

            let sorted = Object.entries(freq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            for (let [word, count] of sorted) {
                console.log(`${word} → ${count} times`);
            }
        }

    } finally {
        await driver.quit();
        console.log("\nFinished Successfully ✔");
    }
}

start();
