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
  // running = true;   // Date variables for report generation
  const currentDate = new Date();

  // Calculate start date (7 days ago, including both dates)
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - 6); // 6 days back + today = 7 days total

  // Calculate current week of the year (Monday to Monday)
  const getWeekNumber = (date) => {
    const tempDate = new Date(date.getTime());
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    const dayNum = tempDate.getDay() || 7;
    tempDate.setDate(tempDate.getDate() + 4 - dayNum);
    // Get first day of year
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    // Calculate full weeks to nearest Thursday
    return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  };
  const currentWeek =
    getWeekNumber(currentDate) > 2 ? getWeekNumber(currentDate) - 1 : 1;

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

    const HSDResponseProduction = await axios.post(
      `${process.env.SEND_REPORT_BACKEND_SERVER}/api/report/send-report`,
      {
        url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/CNC/production?date=${startDate}%2C${currentDate}}`,

        elementId: "CNC-production",
        subject: "Daily Report",
        text: "Here is your daily report.",
        graph: "CNC",
        whatsappTemplate: { name: "daily_report", language: "en" },
      }
      // { timeout: 90_000 }
    );

    const HSDResponseMIS = await axios.post(
      `${process.env.SEND_REPORT_BACKEND_SERVER}/api/report/send-report`,
      {
        url: `${process.env.SEND_REPORT_FRONTEND_SERVER}/dashboard/CNC/mis?selectedWeek=${currentWeek}&selectedDepts=Production+`,

        elementId: "CNC-mis",
        subject: "Daily Report",
        text: "Here is your daily report.",
        graph: "CNC",
        whatsappTemplate: { name: "daily_report", language: "en" },
      }
      // { timeout: 90_000 }
    );
    console.log("[sendDailyReport]", response.data?.message || "OK");
    console.log("[HSD REPORTS]", HSDResponseProduction.data?.message || "OK");
    console.log("[HSD REPORTS]", HSDResponseMIS.data?.message || "OK");
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
