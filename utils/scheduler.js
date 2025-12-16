const cron = require("node-cron");
const axios = require("axios");
const db = require("../config/db");

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
    iterateDepartments: false,
  },
  {
    id: "cnc-production",
    name: "CNC Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/CNC/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "CNC",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 2,
    iterateDepartments: true,
  },
  {
    id: "cnc-mis",
    name: "CNC MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/CNC/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "CNC",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 3,
    iterateDepartments: true,
  },
  {
    id: "HSD-production",
    name: "HSD Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "HSD",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 4,
    iterateDepartments: true,
  },
  {
    id: "HSD-mis",
    name: "HSD MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/MIS`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "HSD",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 5,
    iterateDepartments: true,
  },
  {
    id: "COW-production",
    name: "COW Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/COW/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "COW",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 6,
    iterateDepartments: true,
  },
  {
    id: "COW-mis",
    name: "COW MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/COW/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "COW",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 7,
    iterateDepartments: true,
  },
  {
    id: "GI-production",
    name: "GI Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/GI/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "GI",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 8,
    iterateDepartments: true,
  },
  {
    id: "GI-mis",
    name: "GI MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/GI/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "GI",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 9,
    iterateDepartments: true,
  },
  {
    id: "MISCLLANEOUS-production",
    name: "MISCLLANEOUS Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Miscellaneous/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "Miscellaneous",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 10,
    iterateDepartments: true,
  },
  {
    id: "MISCLLANEOUS-mis",
    name: "MISCLLANEOUS MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Miscellaneous/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "Miscellaneous",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 11,
    iterateDepartments: true,
  },
  {
    id: "OCTAPOLE-production",
    name: "OCTAPOLE Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Octapole/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "Octapole",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 12,
    iterateDepartments: true,
  },
  {
    id: "OCTAPOLE-mis",
    name: "OCTAPOLE MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Octapole/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "Octapole",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 13,
    iterateDepartments: true,
  },
  {
    id: "SOLAR-production",
    name: "SOLAR Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Solar/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "Solar",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 14,
    iterateDepartments: true,
  },
  {
    id: "SOLAR-mis",
    name: "SOLAR MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Solar/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "Solar",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 15,
    iterateDepartments: true,
  },
  {
    id: "ZETWORK-production",
    name: "ZETWORK Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Zetwork/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "Zetwork",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 16,
    iterateDepartments: true,
  },
  {
    id: "ZETWORK-mis",
    name: "ZETWORK MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Zetwork/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "Zetwork",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 17,
    iterateDepartments: true,
  },
  {
    id: "RAMBOLL-production",
    name: "RAMBOLL Production",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/RAMBOLL/production`,
    elementId: ["production-item-wise", "production-day-wise"],
    subject: "Daily Report",
    text: "Here is your daily production report.",
    graph: "RAMBOLL",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 18,
    iterateDepartments: true,
  },
  {
    id: "RAMBOLL-mis",
    name: "RAMBOLL MIS",
    url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/RAMBOLL/mis`,
    elementId: "mis-dept-wise",
    subject: "Daily Report",
    text: "Here is your daily MIS report.",
    graph: "RAMBOLL",
    whatsappTemplate: { name: "daily_report", language: "en" },
    priority: 19,
    iterateDepartments: true,
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

// Utility function to fetch departments
const fetchDepartments = async (type) => {
  try {
    // Fetch sheet_id directly from DB
    const sheetInfo = await db("google_sheet_info")
      .where({
        type: type,
        default_sheet: true
      })
      .first();

    if (!sheetInfo || !sheetInfo.sheet_id) {
       console.warn(`No default sheet found for type: ${type}`);
       return [];
    }

    const response = await axios.get(
      `${process.env.SEND_REPORT_FRONTEND_SERVER}/api/meta/departments?type=${type}&sheet_id=${sheetInfo.sheet_id}`
    );
    return response.data?.departments || [];
  } catch (error) {
    console.error(`Error fetching departments for ${type}:`, error.message);
    return [];
  }
};

const fetchSupervisors = async (type, dept, startDate, endDate) => {
  try {
     const sheetInfo = await db("google_sheet_info")
      .where({
        type: type,
        default_sheet: true
      })
      .first();

    if (!sheetInfo || !sheetInfo.sheet_id) return [];

    const response = await axios.get(
      `${process.env.SEND_REPORT_FRONTEND_SERVER}/api/meta/supervisors?type=${type}&sheet_id=${sheetInfo.sheet_id}&dept=${encodeURIComponent(dept)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
    return response.data?.supervisors || [];
  } catch (error) {
     console.error(`Error fetching supervisors for ${type}/${dept}:`, error.message);
     return [];
  }
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
     
    if (dashboardConfig.department) {
       requestData.url += `&selectedDepts=${encodeURIComponent(dashboardConfig.department)}`;
    }
  }

  // Add week parameters for MIS dashboards
  if (dashboardConfig.id.includes("mis")) {
    const deptParam = dashboardConfig.department ? encodeURIComponent(dashboardConfig.department) : "Production";
    requestData.url += `?selectedWeek=${currentWeek}&selectedDepts=${deptParam}`;
  }

  // Add graph parameter if specified
  if (dashboardConfig.graph) {
    requestData.graph = dashboardConfig.graph;
  }

  // Add department parameter if specified (for granular filtering)
  if (dashboardConfig.department) {
    requestData.department = dashboardConfig.department;
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

  // Define the types we want to process for detailed reports
  const REPORT_TYPES = [
      { type: "CNC", misUrl: "/dashboard/CNC/mis", prodUrl: "/dashboard/CNC/production" },
      { type: "HSD", misUrl: "/dashboard/MIS", prodUrl: "/dashboard/production" }, // HSD maps to base URLs? Checks DASHBOARD_CONFIGS. Yes.
      { type: "COW", misUrl: "/dashboard/COW/mis", prodUrl: "/dashboard/COW/production" },
      { type: "GI", misUrl: "/dashboard/GI/mis", prodUrl: "/dashboard/GI/production" },
      { type: "Miscellaneous", misUrl: "/dashboard/Miscellaneous/mis", prodUrl: "/dashboard/Miscellaneous/production" },
      { type: "Octapole", misUrl: "/dashboard/Octapole/mis", prodUrl: "/dashboard/Octapole/production" },
      { type: "Solar", misUrl: "/dashboard/Solar/mis", prodUrl: "/dashboard/Solar/production" },
      { type: "Zetwork", misUrl: "/dashboard/Zetwork/mis", prodUrl: "/dashboard/Zetwork/production" },
      { type: "RAMBOLL", misUrl: "/dashboard/RAMBOLL/mis", prodUrl: "/dashboard/RAMBOLL/production" },
            { type: "BHILAI", misUrl: "/dashboard/BHILAI/mis", prodUrl: "/dashboard/BHILAI/production" },
  ];

  console.log(`🚀 Starting processing of ${REPORT_TYPES.length} report types...`);
  const { startISO, endISO, currentWeek } = getDateRange();
  const frontendUrl = process.env.SEND_REPORT_FRONTEND_SERVER;

  for (const group of REPORT_TYPES) {
      console.log(`\n📂 Processing Group: ${group.type}`);
      const departments = await fetchDepartments(group.type);

      if (!departments.length) {
          console.warn(`   No departments found for ${group.type}, skipping.`);
          continue;
      }

      for (const dept of departments) {
          console.log(`   ➡ Department: ${dept}`);
          const supervisors = await fetchSupervisors(group.type, dept, startISO, endISO);
          
          // Construct Pages
          const pages = [];

          // 1. Production Dashboard (Item Wise - Dept Level)
          // URL Params: date, selectedDepts
          const prodBaseUrl = `${frontendUrl}${group.prodUrl}`;
          const prodUrl = `${prodBaseUrl}?date=${encodeURIComponent(startISO)},${encodeURIComponent(endISO)}&selectedDepts=${encodeURIComponent(dept)}`;
          
          pages.push({
              url: prodUrl,
              items: [{ id: "production-item-wise", name: `${group.type}_${dept}_Item_Wise.png` }]
          });

          // 2. MIS Dashboard (Dept Wise - Dept Level)
          // URL Params: selectedWeek, selectedDepts
          const misBaseUrl = `${frontendUrl}${group.misUrl}`;
          // For MIS, deptParam ensures filtering
          const misUrl = `${misBaseUrl}?selectedWeek=${currentWeek}&selectedDepts=${encodeURIComponent(dept)}`;
          
          pages.push({
              url: misUrl,
              items: [{ id: "mis-dept-wise", name: `${group.type}_${dept}_MIS.png` }]
          });

          // 3. Supervisor Day-Wise Graphs
          for (const sup of supervisors) {
             // Production Dashboard, filtered by Supervisor
             // Should we also keep Department filter? Yes, context.
             const supUrl = `${prodBaseUrl}?date=${encodeURIComponent(startISO)},${encodeURIComponent(endISO)}&selectedDepts=${encodeURIComponent(dept)}&selectedSupervisors=${encodeURIComponent(sup)}`;
             
             // Sanitize filename
             const safeSup = sup.replace(/[^a-z0-9]/gi, '_');
             pages.push({
                 url: supUrl,
                 items: [{ id: "production-day-wise", name: `${group.type}_${dept}_${safeSup}_Day_Wise.png` }]
             });
          }
          
          // Construct Request payload
          const requestBody = {
              subject: `Daily Report - ${group.type} - ${dept}`,
              text: `Attached is the daily report for ${group.type} Department: ${dept}.\nIncludes Item-wise production, MIS data, and Day-wise production for ${supervisors.length} supervisors.`,
              graph: group.type, // For recipient filtering
              department: dept,
              pages: pages,
              id: `${group.type}-${dept}-combined` // For logging
          };

          // Send Request
           try {
            console.log(`      Sending report with ${pages.length} pages...`);
            const response = await axios.post(
                `${process.env.SEND_REPORT_BACKEND_SERVER}/api/report/send-report`,
                requestBody,
                {
                    timeout: CONFIG.TIMEOUT_MS * Math.max(1, pages.length / 2), // Increase timeout based on pages
                    headers: { "Content-Type": "application/json" }
                }
            );
            results.push({ success: true, dashboard: requestBody.subject, message: response.data?.message });
            console.log(`      ✅ Sent.`);

            // Delay between departments
            await delay(CONFIG.REQUEST_DELAY_MS);
          } catch (e) {
              console.error(`      ❌ Failed:`, e.message);
              results.push({ success: false, dashboard: requestBody.subject, error: e.message });
          }
      }
  }

  // Preserve original Daily Report (General) logic if needed?
  // Use DASHBOARD_CONFIGS[0] ("Daily Report")
  const dailyReport = DASHBOARD_CONFIGS.find(d => d.id === "daily-report");
  if (dailyReport) {
       console.log(`\n📊 Sending General Daily Report...`);
       const res = await sendDashboardRequest(dailyReport);
       results.push(res);
  }

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
console.log(`🎯 Configured for ${DASHBOARD_CONFIGS.length} base dashboards`);
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
