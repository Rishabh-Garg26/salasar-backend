const db = require("../config/db"); // your knex instance
const { captureDashboardScreenshots } = require("../services/screenshotService");
const { sendReportEmail } = require("../services/emailService");
const {
  sendWhatsappTemplateWithImage,
} = require("../services/whatsappService");

const sendReport = async (req, res) => {
  try {
    const { url, elementId, subject, text, graph, department, whatsappTemplate, pages } = req.body;

    // Use pages if available, else fallback to url/elementId for backward compatibility or simple calls
    const hasPages = pages && Array.isArray(pages) && pages.length > 0;
    
    if ((!url || !elementId) && !hasPages) {
      return res.status(400).json({ message: "Missing required fields (url/elementId or pages)" });
    }
    
    if (!subject || !text) {
        return res.status(400).json({ message: "Missing required fields (subject/text)" });
    }

    // ... (recipients logic is fine) ...

    // Only users with at least one channel enabled are considered.
    // We fetch a broader set and filter in JS for granular permissions (e.g., "CNC" vs "CNC - Production")
    let query = db("notifications_permissions")
      .select(
        "id",
        "name",
        "emailEnabled",
        "phoneEnabled",
        "email",
        "phone",
        "cc",
        "graphs"
      )
      .where((builder) => {
        builder.where("emailEnabled", true).orWhere("phoneEnabled", true);
      });

    if (graph) {
      // Broad filtering: fetch anyone associated with this graph tag
      // This will match "CNC", "CNC - Production", "CNC - Quality"
      query = query.andWhere("graphs", "like", `%${graph}%`);
    }

    const recipientsRaw = await query;

    // Granular Filtering in JS
    const recipients = recipientsRaw.filter(r => {
        if (!graph) return true; // No graph filter, allow all (or logic above filtered nothing)
        
        let permissions = [];
        try {
            permissions = typeof r.graphs === 'string' ? JSON.parse(r.graphs) : r.graphs;
        } catch (e) {
            // If not JSON, treat as string (maybe CSV in older versions? But code uses JSON)
            permissions = [r.graphs];
        }

        if (!Array.isArray(permissions)) permissions = [];

        // 1. Direct Match to Main Graph (e.g. "CNC") - Gives access to ALL sub-departments
        if (permissions.includes(graph)) return true;

        // 2. Specific Match (e.g. "CNC - Production")
        if (department) {
             const specificPermission = `${graph} - ${department}`;
             if (permissions.includes(specificPermission)) return true;
        } else {
             // If no department specified in request, but user matched "CNC...", 
             // it means the report is generic or user has some CNC access.
             // If the report acts as a 'summary', maybe allow? 
             // But here we are sending specific reports.
             // If request has no department, we assume it's a general report or check generic permission.
             // Existing logic allowed generic match.
             // If we just matched `like %CNC%`, we might return "CNC - Quality" user for "CNC" general report?
             // Let's assume strictness: if user has ONLY "CNC - Quality", they shouldn't get generic "CNC" report if it implies ALL.
             // BUT, if the report is truly generic, keep generic.
             return false; 
        }

        return false;
    });

    if (!recipients.length) {
      return res
        .status(200)
        .json({ message: "No recipients matched filters." });
    }

    let imageBuffers;
    if (hasPages) {
        imageBuffers = await captureDashboardScreenshots(pages);
    } else {
        // Fallback: construct single page
        const ids = Array.isArray(elementId) ? elementId : [elementId];
        const items = ids.map((id, idx) => ({ id, name: `report_${idx+1}.png` }));
        imageBuffers = await captureDashboardScreenshots([{ url, items }]);
    }

    // EMAIL TARGETS
    const emailPromises = [];
    
    // Deduplicate sends by unique (email + cc) combo? 
    // Or just iterate recipients. A user might receive multiple emails if they have multiple profiles?
    // Usually unique email.
    
    // We iterate recipients because each might have different CCs.
    // If multiple users have same email, they get duplicate.
    // Ideally we shouldn't have duplicate users.
    
    for (const r of recipients) {
        if (r.emailEnabled && r.email) {
            const cc = r.cc ? r.cc.split(',').map(e => e.trim()).filter(Boolean) : [];
            emailPromises.push(sendReportEmail(r.email.trim(), subject, text, imageBuffers, cc));
        }
    }

    // WHATSAPP TARGETS (Keep existing logic)
    const whatsappTargets = recipients
      .filter((r) => r.phoneEnabled && r.phone)
      .map((r) => r.phone.trim())
      .filter(Boolean);

    const waSet = new Set(whatsappTargets);
    const uniquePhones = [...waSet];


    const waTemplate = {
      name: whatsappTemplate?.name || "report_with_image",
      language: whatsappTemplate?.language || "en",
    };
    // console.log("waTemplate", waTemplate);

    

    const waSends = uniquePhones.map((msisdn) =>
          sendWhatsappTemplateWithImage({
            to: msisdn,
            templateName: waTemplate.name,
            languageCode: waTemplate.language,
            headerImageBuffer: imageBuffers[0]?.content,
            bodyParams: [text], // adjust according to your template placeholders
          })
        );

    // --- LOGIC FOR SENDING MULTIPLE IMAGES (One message per image) ---
    /*
    const waSendsMultiple = [];
    uniquePhones.forEach((msisdn) => {
      // Loop through ALL image buffers
      imageBuffers.forEach((imgBuffer, idx) => {
         waSendsMultiple.push(
            sendWhatsappTemplateWithImage({
              to: msisdn,
              templateName: waTemplate.name,
              languageCode: waTemplate.language,
              headerImageBuffer: imgBuffer.content,
              // Optionally add index/name to text if you want to distinguish messages
              bodyParams: [`${text} (Part ${idx+1}/${imageBuffers.length})`], 
            })
         );
      });
    });
    // Then await Promise.all(waSendsMultiple) ...
    */



    const [
      emailResults,
      waResults,
    ] = await Promise.all([
      Promise.allSettled(emailPromises),
      Promise.allSettled(waSends),
    ]);

    const emailFailed = emailResults.filter(
      (r) => r.status === "rejected"
    ).length;

    const waFailed = waResults.filter((r) => r.status === "rejected").length;

    console.log(waFailed);
    
    return res.status(200).json({
      message: "Dispatch complete",
      summary: {
        email: { attempted: emailPromises.length, failed: emailFailed },
        whatsapp: { attempted: uniquePhones.length, failed: waFailed },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending report" });
  }
};

module.exports = { sendReport };
