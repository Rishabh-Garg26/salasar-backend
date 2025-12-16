const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "Email Verification",
    html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

const sendVforgotPasswordEmail = async (email, token) => {
  const passwordRestUrl = `${process.env.FRONTEND_URL}/forgotPassword?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "Email Verification",
    html: `<p>Click <a href="${passwordRestUrl}">here</a> to verify your email.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

const sendReportEmail = async (to, subject, text, attachmentsData, cc = []) => {
  // Ensure we work with an array
  const buffers = Array.isArray(attachmentsData)
    ? attachmentsData
    : [attachmentsData];

  const attachments = buffers.map((item, index) => {
    if (item && item.filename && item.content) {
        return {
            filename: item.filename,
            content: item.content,
            contentType: "image/png"
        };
    }
    return {
      filename: `report_${index + 1}.png`,
      content: item,
      contentType: "image/png",
    };
  });

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
    cc, // Add CC
    subject,
    text,
    attachments,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendVforgotPasswordEmail,
  sendReportEmail,
};
