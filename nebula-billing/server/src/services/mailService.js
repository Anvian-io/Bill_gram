import { env } from "../config/env.js";

const loadNodemailer = async () => {
  try {
    const nodemailerModule = await import("nodemailer");
    return nodemailerModule.default;
  } catch {
    throw new Error(
      "nodemailer is not installed yet. Run `npm install` inside the server folder to enable SMTP delivery.",
    );
  }
};

const assertMailConfig = () => {
  if (
    !env.sendinblueHost ||
    !env.sendinblueUser ||
    !env.sendinbluePassword ||
    !env.senderEmail
  ) {
    throw new Error("Brevo SMTP configuration is incomplete in server/.env");
  }
};

export const sendOtpEmail = async ({ email, otp, expiresInMinutes }) => {
  assertMailConfig();
  const nodemailer = await loadNodemailer();

  const transporter = nodemailer.createTransport({
    host: env.sendinblueHost,
    port: env.sendinbluePort,
    secure: false,
    auth: {
      user: env.sendinblueUser,
      pass: env.sendinbluePassword,
    },
  });

  await transporter.sendMail({
    from: `"${env.senderName}" <${env.senderEmail}>`,
    to: email,
    subject: "BillGram admin login OTP",
    text: `Your BillGram OTP is ${otp}. It will expire in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 8px;">BillGram Admin Login</h2>
        <p>Your one-time password is:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 16px 0; color: #0f766e;">
          ${otp}
        </div>
        <p>This OTP will expire in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this login, you can ignore this email.</p>
      </div>
    `,
  });
};
