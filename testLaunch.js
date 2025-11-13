const puppeteer = require("puppeteer");

async function runTest() {
  let browser;
  console.log("Attempting to launch browser...");

  try {
    browser = await puppeteer.launch({
      headless: false,
      // slowMo slows down Puppeteer operations so you can see what's happening.
      slowMo: 100,
    });

    console.log("✅ Browser launched successfully!");
    const page = await browser.newPage();

    await page.goto("https://google.com");
    console.log("Navigated to Google. The browser will close in 10 seconds.");

    // Keep the browser open for 10 seconds to ensure you can see it.
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error("❌ Failed to launch or operate browser:", error);
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed.");
    }
  }
}

runTest();
