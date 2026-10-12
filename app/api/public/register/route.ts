import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { publicRegistrationSchema } from "@/lib/validators/public";
import { rateLimit, RATE_LIMITS, clientIp } from "@/lib/rate-limit";
import { db } from "@/db";
import { registrationRequests } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { sendEmailInBackground } from "@/lib/email";
import { adminNewRegistrationEmail, registrationReceivedEmail } from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";

/** POST /api/public/register — public registration request (no auth). */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit({ key: `register:${ip}`, ...RATE_LIMITS.publicForm });
  if (!limited.ok) {
    return jsonError("Too many submissions — try again in a few minutes", 429, {
      retryAfterSeconds: limited.retryAfterSeconds,
    });
  }

  const parsed = await parseJsonBody(request, publicRegistrationSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const [row] = await db
    .insert(registrationRequests)
    .values({
      fullName: d.fullName,
      email: d.email || null,
      phone: d.phone,
      courseIds: d.courseIds,
      preferredSchedule: d.preferredSchedule || null,
      educationLevel: d.educationLevel ?? null,
      guardianName: d.guardianName || null,
      guardianPhone: d.guardianPhone || null,
      guardianRelationship: d.guardianRelationship || null,
      message: d.message || null,
    })
    .returning({ id: registrationRequests.id });

  await logAudit({
    actorRole: "student",
    action: "public.registration_submitted",
    entityType: "registration_request",
    entityId: row!.id,
    summary: `Public registration from ${d.fullName} (${d.phone})`,
  });

  if (d.email) {
    sendEmailInBackground({
      to: d.email,
      ...registrationReceivedEmail({ name: d.fullName, courses: `${d.courseIds.length} course(s)` }),
    });
  }
  sendEmailInBackground({
    to: siteConfig.email,
    ...adminNewRegistrationEmail({
      name: d.fullName,
      phone: d.phone,
      courses: `${d.courseIds.length} course(s)`,
      url: `${siteConfig.url}/admin/requests`,
    }),
  });

  return jsonOk({ id: row!.id, site: siteConfig.name });
}
