const cron = require("node-cron");
const axios = require("axios");

// Configuration for request delays and retries
const CONFIG = {
  REQUEST_DELAY_MS: 2000, // 2 seconds between requests to respect rate limits
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000, // 5 seconds between retries
  TIMEOUT_MS: 90000, // 90 seconds timeout per request
  CONCURRENT_REQUESTS: 1, // Sequential processing only
};

// Dashboard configuration - easily extensible
const DASHBOARD_CONFIGS = [
  {
    id: "daily-report",
    name: "Daily Report",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Report`,
    elementId: "ReportTable",
    subject: "Daily Report",
    text: "Here is your daily report.",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 1,
  },
  {
    id: "cnc-production",
    name: "CNC Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/CNC/production`,
    elementId: "CNC-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "CNC",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 2,
  },
  {
    id: "cnc-mis",
    name: "CNC MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/CNC/mis`,
    elementId: "CNC-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "CNC",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 3,
  },
  {
    id: "HSD-production",
    name: "HSD Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/production`,
    elementId: "HSD-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "HSD",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 4,
  },
  {
    id: "HSD-mis",
    name: "HSD MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/MIS`,
    elementId: "HSD-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "HSD",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 5,
  },
  {
    id: "COW-production",
    name: "COW Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/COW/production`,
    elementId: "COW-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "COW",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 6,
  },
  {
    id: "COW-mis",
    name: "COW MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/COW/mis`,
    elementId: "COW-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "COW",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 7,
  },
  {
    id: "GI-production",
    name: "GI Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/GI/production`,
    elementId: "GI-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "GI",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 8,
  },
  {
    id: "GI-mis",
    name: "GI MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/GI/mis`,
    elementId: "GI-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "GI",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 9,
  },
  {
    id: "MISCLLANEOUS-production",
    name: "MISCLLANEOUS Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Miscellaneous/production`,
    elementId: "MISCLLANEOUS-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "Miscellaneous",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 8,
  },
  {
    id: "MISCLLANEOUS-mis",
    name: "MISCLLANEOUS MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Miscellaneous/mis`,
    elementId: "MISCLLANEOUS-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "Miscellaneous",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 9,
  },
  {
    id: "OCTAPOLE-production",
    name: "OCTAPOLE Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Octapole/production`,
    elementId: "OCTAPOLE-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "OCTAPOLE",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 10,
  },
  {
    id: "OCTAPOLE-mis",
    name: "OCTAPOLE MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Octapole/mis`,
    elementId: "OCTAPOLE-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "OCTAPOLE",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 11,
  },
  {
    id: "SOLAR-production",
    name: "SOLAR Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Solar/production`,
    elementId: "SOLAR-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "SOLAR",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 12,
  },
  {
    id: "SOLAR-mis",
    name: "SOLAR MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Solar/mis`,
    elementId: "SOLAR-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "SOLAR",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 13,
  },
  {
    id: "ZETWORK-production",
    name: "ZETWORK Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Zetwork/production`,
    elementId: "ZETWORK-production",
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "ZETWORK",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 14,
  },
  {
    id: "ZETWORK-mis",
    name: "ZETWORK MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Zetwork/mis`,
    elementId: "ZETWORK-mis",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "ZETWORK",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 15,
  },
];

// Utility function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to get current date range for reports
const getDateRange = () => {
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 6);
  const startISO = startDate.toISOString();
  const endISO = currentDate.toISOString();

  // Calculate current week
  const getWeekNumber = (date) => {
    const tempDate = new Date(date.getTime());
    const dayNum = tempDate.getDay() || 7;
    tempDate.setDate(tempDate.getDate() + 4 - dayNum);
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  };
  const currentWeek =
    getWeekNumber(currentDate) > 2 ? getWeekNumber(currentDate) - 1 : 1;

  return { startISO, endISO, currentWeek };
};

// Single request handler with retry mechanism
const sendDashboardRequest = async (dashboardConfig, retryCount = 0) => {
  const { startISO, endISO, currentWeek } = getDateRange();

  // Prepare request data with date parameters for production and MIS dashboards
  let requestData = {
    url: dashboardConfig.url,
    elementId: dashboardConfig.elementId,
    subject: dashboardConfig.subject,
    text: dashboardConfig.text,
    whatsappTemplate: dashboardConfig.whatsappTemplate,
  };

  // Add date parameters for production dashboards
  if (dashboardConfig.id.includes("production")) {
    requestData.url += `?date=${encodeURIComponent(
      startISO
    )}%2C${encodeURIComponent(endISO)}`;
  }

  // Add week parameters for MIS dashboards
  if (dashboardConfig.id.includes("mis")) {
    requestData.url += `?selectedWeek=${currentWeek}&selectedDepts=Production+`;
  }

  // Add graph parameter if specified
  if (dashboardConfig.graph) {
    requestData.graph = dashboardConfig.graph;
  }

  try {
    console.log(
      `[${dashboardConfig.name}] Starting request (attempt ${
        retryCount + 1
      })...`
    );

    const response = await axios.post(
      `${process.env.SEND_REPORT_BACKEND_SERVER}/api/report/send-report`,
      requestData,
      {
        timeout: CONFIG.TIMEOUT_MS,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const message = response.data?.message || "OK";
    console.log(`[${dashboardConfig.name}] ✅ Success:`, message);
    return { success: true, dashboard: dashboardConfig.name, message };
  } catch (error) {
    const errorDetail =
      error?.response?.data ||
      error?.message ||
      error?.toString() ||
      "Unknown error";
    console.error(
      `[${dashboardConfig.name}] ❌ Error (attempt ${retryCount + 1}):`,
      error
    );

    // Retry logic
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(
        `[${dashboardConfig.name}] Retrying in ${
          CONFIG.RETRY_DELAY_MS / 1000
        } seconds...`
      );
      await delay(CONFIG.RETRY_DELAY_MS);
      return await sendDashboardRequest(dashboardConfig, retryCount + 1);
    }

    console.error(
      `[${dashboardConfig.name}] ❌ Failed after ${
        CONFIG.MAX_RETRIES + 1
      } attempts`
    );
    return {
      success: false,
      dashboard: dashboardConfig.name,
      error: errorDetail,
      attempts: retryCount + 1,
    };
  }
};

// Request queue processor with controlled sequential execution
const processRequestQueue = async () => {
  const results = [];
  const startTime = Date.now();

  console.log(
    `🚀 Starting batch processing of ${DASHBOARD_CONFIGS.length} dashboards...`
  );
  console.log(
    `⏱️  Estimated completion time: ~${(
      (DASHBOARD_CONFIGS.length * CONFIG.REQUEST_DELAY_MS) /
      1000 /
      60
    ).toFixed(1)} minutes`
  );

  // Sort dashboards by priority
  const sortedDashboards = [...DASHBOARD_CONFIGS].sort(
    (a, b) => a.priority - b.priority
  );

  for (let i = 0; i < sortedDashboards.length; i++) {
    const dashboard = sortedDashboards[i];
    const position = i + 1;

    console.log(
      `\n📊 Processing dashboard ${position}/${DASHBOARD_CONFIGS.length}: ${dashboard.name}`
    );

    // Process each dashboard request
    const result = await sendDashboardRequest(dashboard);
    results.push(result);

    // Add delay between requests (except for the last one)
    if (i < sortedDashboards.length - 1) {
      console.log(
        `⏳ Waiting ${
          CONFIG.REQUEST_DELAY_MS / 1000
        } seconds before next request...`
      );
      await delay(CONFIG.REQUEST_DELAY_MS);
    }
  }

  const totalTime = Date.now() - startTime;

  // Generate summary report
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("\n" + "=".repeat(60));
  console.log("📈 BATCH PROCESSING SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Total time: ${(totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(
    `📊 Average time per dashboard: ${(
      totalTime /
      results.length /
      1000
    ).toFixed(1)} seconds`
  );

  if (failed > 0) {
    console.log("\n❌ Failed dashboards:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.dashboard}: ${r.error}`);
      });
  }

  console.log("=".repeat(60));

  return results;
};

// Main scheduler function
async function sendDailyReport() {
  console.log(
    "\n🕐 Daily Report Scheduler Started at:",
    new Date().toISOString()
  );

  try {
    const results = await processRequestQueue();

    // Return summary for external monitoring
    const summary = {
      timestamp: new Date().toISOString(),
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results: results,
    };

    return summary;
  } catch (error) {
    console.error("💥 Critical error in sendDailyReport:", error);
    throw error;
  }
}

// 🧪 Manual testing function (uncomment to test)
// async function testScheduler() {
//   console.log('🧪 Testing scheduler with current configuration...');
//   const result = await sendDailyReport();
//   console.log('📊 Test result:', result);
// }

// ⏰ Schedule daily execution at 8:00 AM IST
cron.schedule("0 8 * * *", sendDailyReport, {
  timezone: "Asia/Kolkata",
  scheduled: true,
});

console.log("📅 Daily Report Scheduler initialized successfully");
console.log(`🎯 Configured for ${DASHBOARD_CONFIGS.length} dashboards`);
console.log(`⏱️  Request delay: ${CONFIG.REQUEST_DELAY_MS / 1000}s`);
console.log(`🔄 Max retries: ${CONFIG.MAX_RETRIES}`);
console.log(`⏰ Schedule: Daily at 8:00 AM IST`);

// Export for testing and monitoring
module.exports = {
  sendDailyReport,
  processRequestQueue,
  sendDashboardRequest,
  DASHBOARD_CONFIGS,
  CONFIG,
};
