const puppeteer = require("puppeteer");
const path = require("path"); // Import path module

const takeScreenshot = async (url, elementId) => {
  // ✅ For debugging, run with a visible browser window. Change to true for production.
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ✅ Listen for any console errors on the page
  page.on("console", (msg) => console.log("PAGE CONSOLE LOG:", msg.text()));

  try {
    // 1. Login
    await page.goto("http://localhost:3000/login", {
      waitUntil: "networkidle2",
    });
    await page.type("#email", process.env.PUPPETEER_USER);
    await page.type("#password", process.env.PUPPETEER_PASSWORD);
    await page.click("#login-button");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // ✅ Log the URL right after login to see where you landed
    console.log("URL after login:", page.url());

    // 2. Navigate to the specific report page
    await page.goto(url, { waitUntil: "networkidle2" });

    // ✅ Log the URL again to confirm you are on the correct page
    console.log("Attempting to find selectors on URL:", page.url());

    // 3. Wait for selectors
    await page.waitForSelector(`#report-dashboard-heading`, {
      visible: true,
      timeout: 30000,
    });

    // 4. ✅ Hide the sidebar using the correct data attribute selector
    console.log("Hiding sidebar element before taking screenshot...");
    await page.$eval(
      '[data-sidebar="sidebar"]',
      (el) => (el.style.display = "none")
    );

    const element = await page.waitForSelector(`#${elementId}`, {
      visible: true,
      timeout: 60000,
    });

    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found.`);
    }

    const imageBuffer = await element.screenshot();
    return imageBuffer;
  } catch (error) {
    // ✅ If any error occurs, take a screenshot to see the final state
    const screenshotPath = path.resolve(__dirname, "error_screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.error(`An error occurred. Screenshot saved to: ${screenshotPath}`);
    console.error(`Final URL was: ${page.url()}`);

    // Re-throw the original error
    throw error;
  } finally {
    await browser.close();
  }
};

module.exports = { takeScreenshot };
