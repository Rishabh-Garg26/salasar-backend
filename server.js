const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 8080;

const { sendDailyReport } = require("./utils/scheduler");

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true, // Allow cookies and credentials
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require("./routes/userRoutes")(app);
const modRoutes = require("./routes/modRoutes");

const reportRoutes = require("./routes/reportRoutes");

app.use("/api/mod", modRoutes);
app.use("/api/report", reportRoutes);

require("./utils/scheduler");

// Test the scheduler
// sendDailyReport()
//   .then((result) => {
//     console.log("✅ Test completed:", result);
//   })
//   .catch((error) => {
//     console.error("❌ Test failed:", error);
//   });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
