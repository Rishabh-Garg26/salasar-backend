const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

// Load env vars
dotenv.config({ path: path.join(__dirname, ".env") });

// Mock DB and other dependencies if needed, or import actual functions
// We want to test the processRequestQueue logic but for a single item. 
// Since processRequestQueue is not easily exported with arguments for single run, 
// I'll copy the relevant logic here to verify it.

const { DASHBOARD_CONFIGS, CONFIG } = require("./utils/scheduler");

// Import DB to fetch real data
const db = require("./config/db");

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

async function runTest() {
    console.log("🚀 Starting Manual Verification Test...");
    
    const TEST_GROUP = { type: "CNC", misUrl: "/dashboard/CNC/mis", prodUrl: "/dashboard/CNC/production" };
    const frontendUrl = process.env.SEND_REPORT_FRONTEND_SERVER;
    // const { startISO, endISO, currentWeek } = getDateRange();
    // Override date for testing 31st Dec 2024 (Last 7 days)
    const startISO = "2024-12-24T00:00:00.000Z";
    const endISO = "2024-12-31T23:59:59.999Z";
    const currentWeek = 53; // Week 53 of 2024

    console.log(`\n📂 Processing Group: ${TEST_GROUP.type}`);
    const departments = await fetchDepartments(TEST_GROUP.type);

    if (!departments.length) {
        console.warn(`   No departments found for ${TEST_GROUP.type}, skipping.`);
        process.exit(1);
    }
    
    // Pick 'Production ' for testing as it has supervisors
    const dept = departments.find(d => d.includes("Production")) || departments[0]; 
    console.log(`   ➡ Testing Department: ${dept}`);
    
    const supervisors = await fetchSupervisors(TEST_GROUP.type, dept, startISO, endISO);
    console.log(`   ➡ Found Supervisors: ${supervisors.join(", ")}`);

    // Construct Pages
    const pages = [];

    // 1. Production Dashboard
    const prodBaseUrl = `${frontendUrl}${TEST_GROUP.prodUrl}`;
    const prodUrl = `${prodBaseUrl}?date=${encodeURIComponent(startISO)},${encodeURIComponent(endISO)}&selectedDepts=${encodeURIComponent(dept)}`;
    
    pages.push({
        url: prodUrl,
        items: [{ id: "production-item-wise", name: `${TEST_GROUP.type}_${dept}_Item_Wise.png` }]
    });

    // 2. MIS Dashboard
    const misBaseUrl = `${frontendUrl}${TEST_GROUP.misUrl}`;
    const misUrl = `${misBaseUrl}?selectedWeek=${currentWeek}&selectedDepts=${encodeURIComponent(dept)}`;
    
    pages.push({
        url: misUrl,
        items: [{ id: "mis-dept-wise", name: `${TEST_GROUP.type}_${dept}_MIS.png` }]
    });

    // 3. Supervisor Day-Wise Graphs (Limit to 1 for testing)
    if (supervisors.length > 0) {
        const sup = supervisors[0];
        console.log(`   ➡ Testing Supervisor Screenshot for: ${sup}`);
        const supUrl = `${prodBaseUrl}?date=${encodeURIComponent(startISO)},${encodeURIComponent(endISO)}&selectedDepts=${encodeURIComponent(dept)}&selectedSupervisors=${encodeURIComponent(sup)}`;
        const safeSup = sup.replace(/[^a-z0-9]/gi, '_');
        pages.push({
            url: supUrl,
            items: [{ id: "production-day-wise", name: `${TEST_GROUP.type}_${dept}_${safeSup}_Day_Wise.png` }]
        });
    }

    console.log("\n📋 Generated Page Requests:");
    pages.forEach(p => {
        console.log(`   - URL: ${p.url}`);
        console.log(`     Items: ${JSON.stringify(p.items)}`);
    });

    // Construct Request payload
    const requestBody = {
        subject: `[TEST] Daily Report - ${TEST_GROUP.type} - ${dept}`,
        text: `Attached is the daily report for ${TEST_GROUP.type} Department: ${dept}.\nIncludes Item-wise production, MIS data, and Day-wise production for supervisors.`,
        graph: TEST_GROUP.type,
        pages: pages,
        id: `${TEST_GROUP.type}-${dept}-test`
    };

    console.log(`\n🚀 Sending Request to backend at ${process.env.SEND_REPORT_BACKEND_SERVER}...`);
    try {
        const response = await axios.post(
            `${process.env.SEND_REPORT_BACKEND_SERVER}/api/report/send-report`, 
            requestBody,
            {
                timeout: 300000, // 5 min
                headers: { "Content-Type": "application/json" }
            }
        );
        console.log(`   ✅ Success:`, response.data);
    } catch (e) {
        console.error(`   ❌ Failed:`);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", e.response.data);
        } else if (e.request) {
             console.error("No response received. Request:", e.request);
        } else {
             console.error("Error setting up request:", e.message);
        }
        console.error("Full Error:", e.toJSON ? e.toJSON() : e);
    }

    process.exit(0);
}

runTest();
