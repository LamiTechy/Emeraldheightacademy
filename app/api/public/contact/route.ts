import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { publicContactSchema } from "@/lib/validators/public";
import { rateLimit, RATE_LIMITS, clientIp } from "@/lib/rate-limit";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { sendEmailInBackground } from "@/lib/email";
import { adminContactEmail } from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";

/** POST /api/public/contact — public contact form (no auth). */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit({ key: `contact:${ip}`, ...RATE_LIMITS.publicForm });
  if (!limited.ok) {
    return jsonError("Too many submissions — try again in a few minutes", 429, {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  const parsed = await parseJsonBody(request, publicContactSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const [row] = await db
    .insert(contactMessages)
    .values({
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject,
      message: d.message,
    })
    .returning({ id: contactMessages.id });

  await logAudit({
    actorRole: "student",
    action: "public.contact_submitted",
    entityType: "contact_message",
    entityId: row!.id,
    summary: `Contact from ${d.name}: “${d.subject}”`,
  });

  sendEmailInBackground({
    to: siteConfig.email,
    ...adminContactEmail({
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject,
      message: d.message,
    }),
  });

  return jsonOk({ id: row!.id });
}
