// const cron = require("node-cron");
// const axios = require("axios");

// let running = false;

// // Schedule the task to run every day at 8:00 AM
// cron.schedule(
//   "0 8 * * *",
//   async () => {
//     if (running) {
//       console.warn(
//         "[sendDailyReport] Previous run still in progress—skipping."
//       );
//       return;
//     }
//     running = true;

//     try {
//       const response = await axios.post(
//         `${[process.env.SEND_REPORT_BACKEND_SERVER]}/api/report/send-report`,
//         {
//           url: `${SEND_REPORT_FRONTEND_SERVER}/dashboard/Report`, // Replace with your report page URL
//           elementId: "ReportTable", // Replace with your ReportTable element ID
//           subject: "Daily Report",
//           text: "Here is your daily report.",
//           whatsappTemplate: {
//             name: "daily_report",
//             language: "en",
//           },
//         }
//       );
//       console.log("[sendDailyReport]", response.data.message);
//     } catch (error) {
//       const detail =
//         err?.response?.data ||
//         err?.message ||
//         err?.toString() ||
//         "Unknown error";
//       console.error("[sendDailyReport] Error sending report:", detail);
//     } finally {
//       running = false;
//     }
//   },
//   { timezone: "Asia/Kolkata" }
// );

const cron = require("node-cron");
const axios = require("axios");

// let running = false;

async function sendDailyReport() {
  // if (running) {
  //   console.warn("[sendDailyReport] Previous run still in progress—skipping.");
  //   return;
  // }
  // running = true;

  try {
    const response = await axios.post(
      `${process.env.SEND_REPORT_BACKEND_SERVER}/api/report/send-report`,
      {
        url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/Report`,
        elementId: "ReportTable",
        subject: "Daily Report",
        text: "Here is your daily report.",
        whatsappTemplate: { name: "daily_report", language: "en" },
      }
      // { timeout: 90_000 }
    );
    console.log("[sendDailyReport]", response.data?.message || "OK");
  } catch (error) {
    const detail =
      error?.response?.data ||
      error?.message ||
      error?.toString() ||
      "Unknown error";
    console.error("[sendDailyReport] Error sending report:", detail);
  } finally {
    running = false;
  }
}

// 🧪 Run immediately once for testing
// sendDailyReport();

// ⏰ Keep daily at 8:00 AM IST
cron.schedule("0 8 * * *", sendDailyReport, { timezone: "Asia/Kolkata" });
