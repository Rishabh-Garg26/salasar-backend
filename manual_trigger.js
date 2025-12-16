const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config({ path: path.join(__dirname, ".env") });

const { sendDailyReport } = require("./utils/scheduler");

async function trigger() {
  console.log("🚀 Manually triggering Daily Report...");
  try {
    const result = await sendDailyReport();
    console.log("✅ Report execution finished:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Report execution failed:", error);
  }
  process.exit();
}

trigger();
