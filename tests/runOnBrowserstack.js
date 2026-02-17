require("dotenv").config();
const { Builder } = require("selenium-webdriver");
const runElPaisTest = require("./elpaisCloud");

const USERNAME = process.env.BROWSERSTACK_USERNAME;
const ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

const GRID_URL = `https://${USERNAME}:${ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`;

const browsers = [
  {
    browserName: "Chrome",
    browserVersion: "latest",
    "bstack:options": { os: "Windows", osVersion: "11" }
  },
  {
    browserName: "Firefox",
    browserVersion: "latest",
    "bstack:options": { os: "Windows", osVersion: "10" }
  },
  {
    browserName: "Edge",
    browserVersion: "latest",
    "bstack:options": { os: "Windows", osVersion: "11" }
  },
  {
    browserName: "Safari",
    browserVersion: "latest",
    "bstack:options": { os: "OS X", osVersion: "Sonoma" }
  },
  {
    deviceName: "iPhone 14",
    realMobile: true,
    osVersion: "16",
    browserName: "Safari"
  }
];

async function runTest(cap) {
  let driver = await new Builder()
    .usingServer(GRID_URL)
    .withCapabilities(cap)
    .build();

  try {
    console.log("\nRunning on:", cap.browserName || cap.deviceName);

    // 🚀 RUN YOUR ASSIGNMENT HERE
    await runElPaisTest(driver);

    console.log("Completed on:", cap.browserName || cap.deviceName);
  } catch (e) {
    console.log("Error on:", cap.browserName || cap.deviceName, e.message);
  } finally {
    await driver.quit();
  }
}

async function runAll() {
  await Promise.all(browsers.map(runTest));
}

runAll();
