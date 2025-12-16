const puppeteer = require("puppeteer");
const path = require("path"); // Import path module

const captureDashboardScreenshots = async (pages) => {
  // ✅ For debugging, run with a visible browser window. Change to true for production.
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ✅ Listen for any console errors on the page
  page.on("console", (msg) => console.log("PAGE CONSOLE LOG:", msg.text()));

  try {
    // 1. Login
    const baseUrl = process.env.SEND_REPORT_FRONTEND_SERVER || "http://localhost:3000";
    await page.goto(`${baseUrl}/login`, {
      waitUntil: "networkidle2",
    });
    await page.type("#email", process.env.PUPPETEER_USER);
    await page.type("#password", process.env.PUPPETEER_PASSWORD);
    await page.click("#login-button");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // ✅ Log the URL right after login to see where you landed
    console.log("URL after login:", page.url());

    const resultAttachments = [];

    // 2. Iterate through requested pages
    for (const pageReq of pages) {
        const { url, items } = pageReq;
        
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: "networkidle2" });
        console.log("Current URL:", page.url());

        // 3. Wait for first selector to ensure page load
        if (items.length > 0) {
            const firstId = items[0].id;
             await page.waitForSelector(`#${firstId}`, {
                visible: true,
                timeout: 30000,
            });
        }

        // 4. Hide sidebar (once per page)
        console.log("Hiding sidebar...");
        try {
            await page.$eval(
                '[data-sidebar="sidebar"]',
                (el) => (el.style.display = "none")
            );
        } catch (e) {
            console.warn("Sidebar selector not found or hiding failed:", e.message);
        }

        // 5. Capture screenshots
        for (const item of items) {
             const { id, name } = item;
             const selector = `#${id}`;
             console.log(`Capturing ${name} (${selector})...`);
             
             try {
                const element = await page.waitForSelector(selector, {
                    visible: true,
                    timeout: 60000,
                });

                if (!element) {
                   throw new Error(`Element "${id}" not found.`);
                }
                
                const buffer = await element.screenshot();
                resultAttachments.push({
                    filename: name,
                    content: buffer
                });
             } catch (err) {
                 console.error(`Failed to capture ${name}:`, err.message);
                 // Optionally push a placeholder or just log
             }
        }
    }

    return resultAttachments;
  } catch (error) {
    // ✅ Keep error screenshot logic
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

module.exports = { captureDashboardScreenshots };
