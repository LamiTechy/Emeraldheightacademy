import { siteConfig } from "@/lib/site";

const PRIMARY = "#2F44E0";
const DARK = "#0F172A";
const MUTED = "#64748B";
const ACCENT_BG = "#EEF2FF";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function button(url: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" bgcolor="${PRIMARY}" style="border-radius:8px;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:${DARK};font-size:15px;line-height:1.6;">${escapeHtml(text)}</p>`;
}

export function muted(text: string): string {
  return `<p style="margin:16px 0 0;color:${MUTED};font-size:13px;line-height:1.5;">${escapeHtml(text)}</p>`;
}

/** Branded responsive shell with a plain-text twin passed in separately. */
export function emailLayout(options: {
  title: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
          <tr>
            <td style="background:${PRIMARY};padding:20px 28px;">
              <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.4px;">${escapeHtml(siteConfig.shortName)}</div>
              <div style="color:#DBEAFE;font-size:12px;margin-top:2px;">${escapeHtml(siteConfig.name)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;color:${DARK};font-size:20px;line-height:1.35;">${escapeHtml(options.title)}</h1>
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:${ACCENT_BG};padding:16px 28px;">
              <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.5;">
                ${escapeHtml(siteConfig.name)} · ${escapeHtml(siteConfig.address)}<br/>
                Questions? Call ${escapeHtml(siteConfig.phone)} or WhatsApp the office.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmail(options: { name: string; resetUrl: string; expiresInMinutes: number }) {
  const bodyHtml = `
    ${paragraph(`Hello ${options.name},`)}
    ${paragraph("We received a request to reset your portal password. Click the button below to choose a new one.")}
    ${button(options.resetUrl, "Reset password")}
    ${muted(`This link expires in ${options.expiresInMinutes} minutes. If you didn't request this, you can safely ignore this email — your password stays unchanged.`)}
  `;
  return {
    subject: `Reset your ${siteConfig.shortName} portal password`,
    html: emailLayout({ title: "Reset your password", bodyHtml }),
    text: `Hello ${options.name},\n\nReset your portal password by opening this link:\n${options.resetUrl}\n\nThe link expires in ${options.expiresInMinutes} minutes. If you didn't request this, ignore this email.\n\n— ${siteConfig.name}`,
  };
}

export function passwordChangedEmail(options: { name: string }): string {
  return `Hello ${options.name},\n\nYour ${siteConfig.shortName} portal password was just changed. If this wasn't you, call the office immediately on ${siteConfig.phone}.\n\n— ${siteConfig.name}`;
}

export function testEmail(options: { to: string }): { subject: string; html: string; text: string } {
  const bodyHtml = `
    ${paragraph(`Hello,`)}
    ${paragraph(`This is a test email from the ${siteConfig.name} portal. Email delivery is working correctly.`)}
    ${muted(`Sent to ${options.to}.`)}
  `;
  return {
    subject: `Test email — ${siteConfig.shortName} portal`,
    html: emailLayout({ title: "Email is configured correctly", bodyHtml }),
    text: `This is a test email from the ${siteConfig.name} portal. Email delivery is working correctly.`,
  };
}

export function registrationReceivedEmail(options: { name: string; courses: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const bodyHtml = `
    ${paragraph(`Hello ${options.name},`)}
    ${paragraph("Thank you for your registration request. We have received it and the office will review it shortly.")}
    ${paragraph(`Courses requested: ${options.courses}`)}
    ${muted("You will receive another email once your request is approved and your student account is created. Payment (if applicable) is completed at the centre office — never online.")}
  `;
  return {
    subject: "We received your registration request",
    html: emailLayout({ title: "Registration request received", bodyHtml }),
    text: `Hello ${options.name},\n\nThank you for your registration request (${options.courses}). The office will review it shortly and email you again with your login details.\n\n— ${siteConfig.name}`,
  };
}

export function registrationApprovedEmail(options: {
  name: string;
  email: string;
  tempPassword?: string;
  loginUrl: string;
  mustChangePassword: boolean;
}): { subject: string; html: string; text: string } {
  const credentialsHtml = options.tempPassword
    ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:0 0 16px;">
         <p style="margin:0 0 6px;color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Your login</p>
         <p style="margin:0;color:${DARK};font-size:14px;"><strong>Email:</strong> ${escapeHtml(options.email)}</p>
         <p style="margin:4px 0 0;color:${DARK};font-size:14px;"><strong>Temporary password:</strong> ${escapeHtml(options.tempPassword)}</p>
       </div>`
    : "";

  const bodyHtml = `
    ${paragraph(`Hello ${options.name},`)}
    ${paragraph("Good news — your registration has been approved and your student portal account is ready.")}
    ${credentialsHtml}
    ${button(options.loginUrl, "Open the portal")}
    ${muted(
      options.mustChangePassword
        ? "You'll be asked to change your temporary password the first time you log in. Keep your login details private."
        : "Keep your login details private.",
    )}
  `;
  return {
    subject: "Your portal account is ready",
    html: emailLayout({ title: "Registration approved", bodyHtml }),
    text: `Hello ${options.name},\n\nYour registration was approved and your portal account is ready.\nEmail: ${options.email}${options.tempPassword ? `\nTemporary password: ${options.tempPassword}` : ""}\nOpen the portal: ${options.loginUrl}\n\n— ${siteConfig.name}`,
  };
}

export function registrationRejectedEmail(options: { name: string; reason: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const bodyHtml = `
    ${paragraph(`Hello ${options.name},`)}
    ${paragraph("Thank you for your interest in " + siteConfig.name + ". Unfortunately we can't proceed with your registration request at this time.")}
    ${paragraph(`Reason: ${options.reason}`)}
    ${muted("You're welcome to visit the centre or call the office on " + siteConfig.phone + " to discuss options.")}
  `;
  return {
    subject: "Update on your registration request",
    html: emailLayout({ title: "Registration request update", bodyHtml }),
    text: `Hello ${options.name},\n\nUnfortunately we can't proceed with your registration request.\nReason: ${options.reason}\n\nYou're welcome to call the office on ${siteConfig.phone}.\n\n— ${siteConfig.name}`,
  };
}

export function adminNewRegistrationEmail(options: {
  name: string;
  phone: string;
  courses: string;
  url: string;
}): { subject: string; html: string; text: string } {
  const bodyHtml = `
    ${paragraph(`A new registration request was submitted on the website.`)}
    ${paragraph(`Name: ${options.name}\nPhone: ${options.phone}\nCourses: ${options.courses}`)}
    ${button(options.url, "Review request")}
  `;
  return {
    subject: `New registration request — ${options.name}`,
    html: emailLayout({ title: "New registration request", bodyHtml }),
    text: `New registration request\nName: ${options.name}\nPhone: ${options.phone}\nCourses: ${options.courses}\nReview: ${options.url}`,
  };
}

export function adminContactEmail(options: {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const bodyHtml = `
    ${paragraph(`New message from the contact form on the website.`)}
    ${paragraph(`From: ${options.name} (${options.email})${options.phone ? ` · ${options.phone}` : ""}`)}
    ${paragraph(`Subject: ${options.subject}`)}
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:0 0 8px;white-space:pre-wrap;color:${DARK};font-size:14px;line-height:1.6;">${escapeHtml(options.message)}</div>
  `;
  return {
    subject: `Website contact — ${options.subject}`,
    html: emailLayout({ title: "New contact message", bodyHtml }),
    text: `New contact message\nFrom: ${options.name} (${options.email})${options.phone ? ` · ${options.phone}` : ""}\nSubject: ${options.subject}\n\n${options.message}`,
  };
}

export function credentialsEmail(options: {
  name: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const bodyHtml = `
    ${paragraph(`Hello ${options.name},`)}
    ${paragraph("An account has been created for you on the portal.")}
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:0 0 16px;">
      <p style="margin:0;color:${DARK};font-size:14px;"><strong>Email:</strong> ${escapeHtml(options.email)}</p>
      <p style="margin:4px 0 0;color:${DARK};font-size:14px;"><strong>Temporary password:</strong> ${escapeHtml(options.tempPassword)}</p>
    </div>
    ${button(options.loginUrl, "Open the portal")}
    ${muted("You'll be asked to change this password the first time you log in.")}
  `;
  return {
    subject: "Your portal login details",
    html: emailLayout({ title: "Your account details", bodyHtml }),
    text: `Hello ${options.name},\n\nYour portal account:\nEmail: ${options.email}\nTemporary password: ${options.tempPassword}\nOpen the portal: ${options.loginUrl}\n\nYou'll be asked to change this password on first login.\n\n— ${siteConfig.name}`,
  };
}
