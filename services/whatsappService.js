// // services/whatsappService.js
// const axios = require("axios");
// const FormData = require("form-data");

// /**
//  * Required env:
//  *   WHATSAPP_TOKEN
//  *   WHATSAPP_PHONE_NUMBER_ID    (from Meta app)
//  */
// const WA_BASE = "https://graph.facebook.com/v24.0";

// async function uploadMedia(
//   buffer,
//   filename = "report.png",
//   mime = "image/png"
// ) {
//   const form = new FormData();
//   form.append("file", buffer, { filename, contentType: mime });
//   form.append("type", mime);
//   // 'messaging_product' required for Cloud API media upload
//   form.append("messaging_product", "whatsapp");

//   const res = await axios.post(
//     `${WA_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
//     form,
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
//         ...form.getHeaders(),
//       },
//     }
//   );
//   return res.data.id; // media_id
// }

// /**
//  * Send a template message with an image header.
//  * Your template must have a HEADER (IMAGE) and possibly body params.
//  */
// async function sendWhatsappTemplateWithImage({
//   to, // E.164, e.g. "9198XXXXXXXX"
//   templateName, // e.g. "report_with_image"
//   languageCode, // e.g. "en"
//   headerImageBuffer, // Buffer
//   bodyParams = [], // array of strings for body placeholders
// }) {
//   console.log(to, templateName, languageCode, headerImageBuffer, bodyParams);
//   // 1) Upload image buffer, get media_id
//   const mediaId = await uploadMedia(headerImageBuffer);

//   // 2) Build template payload
//   const components = [
//     {
//       type: "header",
//       parameters: [{ type: "image", image: { id: mediaId } }],
//     },
//   ];

//   if (bodyParams.length) {
//     components.push({
//       type: "body",
//       parameters: bodyParams.map((v) => ({ type: "text", text: String(v) })),
//     });
//   }

//   const payload = {
//     messaging_product: "whatsapp",
//     to,
//     type: "template",
//     template: {
//       name: templateName,
//       language: { code: languageCode },
//       components,
//     },
//   };

//   // 3) Send template message
//   await axios.post(
//     `${WA_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
//     payload,
//     { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
//   );

//   return true;
// }

// module.exports = {
//   sendWhatsappTemplateWithImage,
// };

// services/whatsappService.js
const axios = require("axios");
const FormData = require("form-data");

/**
 * Required env:
 *   WHATSAPP_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID    (from Meta app)
 * Optional env:
 *   WA_HTTP_TIMEOUT_MS          (default 30000)
 *   WA_MAX_RETRIES              (default 3)
 *   WA_RETRY_BASE_DELAY_MS      (default 500)
 */
const WA_BASE = "https://graph.facebook.com/v24.0";

const http = axios.create({
  baseURL: WA_BASE,
  timeout: Number(process.env.WA_HTTP_TIMEOUT_MS) || 30_000,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  },
});

http.interceptors.response.use(
  (res) => {
    console.log("[WA HTTP] OK", {
      url: res.config?.url,
      status: res.status,
      data: res.data,
    });
    return res;
  },
  (err) => {
    console.error("[WA HTTP] ERROR", {
      url: err?.config?.url,
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    return Promise.reject(err);
  }
);

/** ------------ Error utils ------------ */
class WhatsappApiError extends Error {
  constructor(message, { status, code, fbError, cause } = {}) {
    super(message);
    this.name = "WhatsappApiError";
    this.status = status;
    this.code = code;
    this.fbError = fbError; // raw FB error object if present
    if (cause) this.cause = cause;
  }
}

function extractFbError(err) {
  // WhatsApp Cloud API error shape:
  // err.response.data.error = { message, type, code, error_subcode, error_user_title, error_user_msg, fbtrace_id, details? }
  const fb = err?.response?.data?.error;
  if (!fb) return null;

  return {
    message: fb.message,
    type: fb.type,
    code: fb.code,
    error_subcode: fb.error_subcode,
    error_user_title: fb.error_user_title,
    error_user_msg: fb.error_user_msg,
    details: fb.error_data || fb.details,
    fbtrace_id: fb.fbtrace_id,
  };
}

function isRetryable(err) {
  const status = err?.response?.status;
  if (!status) {
    // timeouts / network errors should retry
    return true;
  }
  // 429 rate limit or 5xx server errors → retry
  if (status === 429 || (status >= 500 && status < 600)) return true;
  return false;
}

async function requestWithRetry(fn, { maxRetries, baseDelayMs } = {}) {
  const retries = Number(process.env.WA_MAX_RETRIES) || maxRetries || 3;
  const base = Number(process.env.WA_RETRY_BASE_DELAY_MS) || baseDelayMs || 500;

  let attempt = 0;
  // simple exponential backoff with jitter
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries || !isRetryable(err)) throw err;

      const retryAfterHeader = err?.response?.headers?.["retry-after"];
      let delay = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : base * Math.pow(2, attempt - 1);

      // add jitter (±20%)
      const jitter = delay * 0.2 * (Math.random() - 0.5) * 2;
      delay = Math.max(250, Math.round(delay + jitter));

      // Optionally log
      console.warn(
        `[WhatsApp API] Transient error (attempt ${attempt}/${retries}). Retrying in ${delay}ms…`,
        {
          status: err?.response?.status,
          fbError: extractFbError(err),
          message: err.message,
        }
      );

      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/** ------------ Input validation ------------ */
function assertEnv() {
  const missing = [];
  if (!process.env.WHATSAPP_TOKEN) missing.push("WHATSAPP_TOKEN");
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID)
    missing.push("WHATSAPP_PHONE_NUMBER_ID");
  if (missing.length) {
    throw new WhatsappApiError(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

function assertPhoneE164(num) {
  if (!/^\d{8,15}$/.test(String(num))) {
    throw new WhatsappApiError(
      "Invalid 'to' phone number. Must be E.164 without '+' (e.g., 9198XXXXXXXX)."
    );
  }
}

function assertBuffer(buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new WhatsappApiError("headerImageBuffer must be a Buffer.");
  }
}

/** ------------ Core API functions ------------ */

async function uploadMedia(
  buffer,
  filename = "report.png",
  mime = "image/png"
) {
  assertEnv();
  assertBuffer(buffer);

  const form = new FormData();
  form.append("file", buffer, { filename, contentType: mime });
  form.append("type", mime);
  form.append("messaging_product", "whatsapp");

  try {
    const res = await requestWithRetry(() =>
      http.post(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`, form, {
        headers: form.getHeaders(), // includes content-type boundary
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      })
    );
    return res.data.id; // media_id
  } catch (err) {
    const fb = extractFbError(err);
    const status = err?.response?.status;
    const code = fb?.code ?? status;

    throw new WhatsappApiError("Failed to upload media to WhatsApp.", {
      status,
      code,
      fbError: fb,
      cause: err,
    });
  }
}

/**
 * Send a template message with an image header.
 * Your template must have a HEADER (IMAGE) and possibly body params.
 */
async function sendWhatsappTemplateWithImage({
  to, // E.164 digits only, e.g. "9198XXXXXXXX"
  templateName, // e.g. "report_with_image"
  languageCode, // e.g. "en"
  headerImageBuffer, // Buffer
  bodyParams = [], // array of strings for body placeholders
}) {
  console.log("[WA SEND] entry", {
    to,
    templateName,
    languageCode,
    bodyParamsLen: bodyParams.length,
    hasBuffer: Buffer.isBuffer(headerImageBuffer),
  });

  assertEnv();

  if (!templateName) {
    throw new WhatsappApiError("templateName is required.");
  }
  if (!languageCode) {
    throw new WhatsappApiError("languageCode is required.");
  }
  // assertPhoneE164(to);
  assertBuffer(headerImageBuffer);

  let mediaId;
  try {
    // 1) Upload image buffer, get media_id
    mediaId = await uploadMedia(headerImageBuffer);

    // 2) Build template payload
    const components = [
      {
        type: "header",
        parameters: [{ type: "image", image: { id: mediaId } }],
      },
    ];

    if (bodyParams.length) {
      components.push({
        type: "body",
        parameters: bodyParams.map((v) => ({ type: "text", text: String(v) })),
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: { id: mediaId },
              },
            ],
          },
        ],
      },
    };

    // 3) Send template message
    const res = await requestWithRetry(() =>
      http.post(
        `/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        payload,
        { validateStatus: () => true } // <= TEMP for debugging
      )
    );

    console.log("[WA SEND] raw", { status: res.status, data: res.data });

    // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", res);

    if (res.status < 200 || res.status >= 300) {
      throw new WhatsappApiError("WA send returned non-2xx.", {
        status: res.status,
        code: res.status,
        fbError: res.data?.error,
      });
    }

    // Return WhatsApp message id when available
    const msgId = res?.data?.messages?.[0]?.id || res?.data?.message_id || null;

    return { ok: true, messageId: msgId, mediaId };
  } catch (err) {
    const fb = extractFbError(err);
    const status = err?.response?.status;
    const code = fb?.code ?? status;

    throw new WhatsappApiError("Failed to send WhatsApp template message.", {
      status,
      code,
      fbError: fb,
      cause: err,
    });
  }
}

module.exports = {
  sendWhatsappTemplateWithImage,
  uploadMedia, // exported for tests if needed
  WhatsappApiError,
};
