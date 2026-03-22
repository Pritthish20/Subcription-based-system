import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "./env";

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type EmailDeliveryResult = {
  provider: "mock" | "smtp";
  messageId?: string;
};

const globalCache = globalThis as typeof globalThis & { smtpTransport?: Transporter };

function getSmtpTransport() {
  const env = getEnv();
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP is selected but SMTP_HOST, SMTP_USER, or SMTP_PASS is missing");
  }

  if (!globalCache.smtpTransport) {
    globalCache.smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE ?? false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  return globalCache.smtpTransport;
}

export async function sendEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
  const env = getEnv();

  if (env.EMAIL_PROVIDER === "smtp") {
    const transport = getSmtpTransport();
    const info = await transport.sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text
    });

    return { provider: "smtp", messageId: info.messageId };
  }

  return { provider: "mock", messageId: `mock-${Date.now()}` };
}
