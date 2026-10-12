import "server-only";
import nodemailer from "nodemailer";

export type EmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM,
  );
}

/**
 * The single send path for all email. Never throws and never blocks a request:
 * - unconfigured → logged in dev, silently skipped in production
 * - transport error → logged as a warning
 */
export async function sendEmail(input: EmailInput): Promise<void> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[email:dev] SMTP not configured — skipping send.\n  to: ${Array.isArray(input.to) ? input.to.join(", ") : input.to}\n  subject: ${input.subject}\n---\n${input.text}\n---`,
      );
    } else {
      console.warn(`[email:skipped] SMTP not configured (to: ${String(input.to)})`);
    }
    return;
  }

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false, // STARTTLS on port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  } catch (error) {
    console.warn("[email] delivery failed:", error);
  }
}

/** Fire-and-forget wrapper: kick off delivery without awaiting the hot path. */
export function sendEmailInBackground(input: EmailInput): void {
  void sendEmail(input);
}
