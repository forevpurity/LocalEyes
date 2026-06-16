import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (process.env.NODE_ENV === "test") return;

  if (!process.env.SMTP_HOST || process.env.SMTP_HOST === "localhost") {
    console.log("📧 Email (dev):", { to: opts.to, subject: opts.subject });
    return;
  }

  transport
    .sendMail({
      from: process.env.MAIL_FROM ?? "LocalEyes <noreply@localeyes.vn>",
      ...opts,
    })
    .catch((err) => console.error("Email send failed:", err));
}
