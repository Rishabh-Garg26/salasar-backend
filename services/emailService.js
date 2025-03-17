const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
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

module.exports = { sendVerificationEmail, sendVforgotPasswordEmail };
