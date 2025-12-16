const express = require("express");
const bodyParser = require("body-parser");
const { sendDailyReport } = require("./utils/scheduler");

const app = express();
const port = 4444;

app.use(bodyParser.json({ limit: "50mb" }));

app.post("/api/report/send-report", (req, res) => {
  const { subject, pages } = req.body;
  console.log(`\n📨 Received Report Request: "${subject}"`);
  console.log(`   - Number of pages: ${pages ? pages.length : 0}`);
  
  if (pages) {
    pages.forEach((p, idx) => {
        console.log(`     Page ${idx+1}: ${p.url}`);
        if(p.items && p.items.length > 0) {
            console.log(`       Items: ${p.items.map(i => i.id).join(", ")}`);
        }
    });
  }
  
  // Respond success
  res.status(200).json({ message: "Mock dispatch complete" });
});

const server = app.listen(port, async () => {
    console.log(`🛡️ Mock Server running on port ${port}`);
    
    // Override the backend server URL for the scheduler
    process.env.SEND_REPORT_BACKEND_SERVER = `http://localhost:${port}`;
    
    // Also override frontend URL if needed (it is used for fetching meta data)
    // We keep frontend URL as is because we want to fetch real departments/supervisors from the running frontend.
    // Assuming the real frontend is running on 3000.
    
    console.log("🚀 Triggering Scheduler...");
    try {
        const result = await sendDailyReport();
        console.log("\n✅ Scheduler execution result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("❌ Scheduler failed:", e);
    }
    
    server.close();
    process.exit(0);
});
