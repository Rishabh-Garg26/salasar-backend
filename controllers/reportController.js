const db = require("../config/db"); // your knex instance
const { takeScreenshot } = require("../services/screenshotService");
const { sendReportEmail } = require("../services/emailService");
const {
  sendWhatsappTemplateWithImage,
} = require("../services/whatsappService");

const sendReport = async (req, res) => {
  try {
    const { url, elementId, subject, text, graph, whatsappTemplate } = req.body;

    if (!url || !elementId || !subject || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1) Fetch recipients from notifications_permissions
    // Only users with at least one channel enabled are considered.
    // If 'graph' is sent, filter to those whose graphs include it (simple LIKE match).
    let query = db("notifications_permissions")
      .select(
        "id",
        "name",
        "emailEnabled",
        "phoneEnabled",
        "email",
        "phone",
        "graphs"
      )
      .where((builder) => {
        builder.where("emailEnabled", true).orWhere("phoneEnabled", true);
      });

    if (graph) {
      // If graphs stored as TEXT[] or JSON, adjust accordingly.
      // Fallback: store as CSV or JSON string and do LIKE.
      query = query.andWhere("graphs", "like", `%${graph}%`);
    }

    const recipients = await query;

    if (!recipients.length) {
      return res
        .status(200)
        .json({ message: "No recipients matched filters." });
    }

    const imageBuffer = await takeScreenshot(url, elementId);

    const emailTargets = recipients
      .filter((r) => r.emailEnabled && r.email)
      .map((r) => r.email.trim())
      .filter(Boolean);

    // optional dedupe
    const emailSet = new Set(emailTargets);
    const uniqueEmails = [...emailSet];

    const whatsappTargets = recipients
      .filter((r) => r.phoneEnabled && r.phone)
      .map((r) => r.phone.trim())
      .filter(Boolean);

    const waSet = new Set(whatsappTargets);
    const uniquePhones = [...waSet];

    const emailSends = uniqueEmails.map((to) =>
      sendReportEmail(to, subject, text, imageBuffer)
    );

    const waTemplate = {
      name: whatsappTemplate?.name || "report_with_image",
      language: whatsappTemplate?.language || "en",
    };

    console.log("waTemplate", waTemplate);

    // const waSends = uniquePhones.map((msisdn) =>
    //   sendWhatsappTemplateWithImage({
    //     to: msisdn,
    //     templateName: waTemplate.name,
    //     languageCode: waTemplate.language,
    //     headerImageBuffer: imageBuffer,
    //     bodyParams: [text], // adjust according to your template placeholders
    //   })
    // );

    const [
      emailResults,
      // waResults,
    ] = await Promise.all([
      Promise.allSettled(emailSends),
      // Promise.allSettled(waSends),
    ]);

    const emailFailed = emailResults.filter(
      (r) => r.status === "rejected"
    ).length;
    // const waFailed = waResults.filter((r) => r.status === "rejected").length;

    return res.status(200).json({
      message: "Dispatch complete",
      summary: {
        email: { attempted: uniqueEmails.length, failed: emailFailed },
        // whatsapp: { attempted: uniquePhones.length, failed: waFailed },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending report" });
  }
};

module.exports = { sendReport };
