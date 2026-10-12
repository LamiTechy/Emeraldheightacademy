import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, registrationRequests } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/** GET /api/admin/requests — all public requests (registrations, contacts). */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const [registrations, contacts] = await Promise.all([
    db.select().from(registrationRequests).orderBy(desc(registrationRequests.createdAt)),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
  ]);

  return jsonOk({ registrations, contacts });
}

const updateStatusSchema = z.object({
  kind: z.enum(["registration", "contact"]),
  id: z.uuid(),
  status: z.string().trim().min(2).max(30),
  rejectionReason: z.string().trim().max(500).optional(),
});

/** PATCH /api/admin/requests — update the status of any public request. */
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateStatusSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  if (d.kind === "registration") {
    const existing = await db.query.registrationRequests.findFirst({
      where: eq(registrationRequests.id, d.id),
    });
    if (!existing) return jsonError("Registration not found", 404);
    await db
      .update(registrationRequests)
      .set({
        status: d.status as typeof existing.status,
        rejectionReason: d.rejectionReason ?? existing.rejectionReason,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(registrationRequests.id, d.id));
    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: "requests.registration_status",
      entityType: "registration_request",
      entityId: d.id,
      summary: `Registration ${d.status} for ${existing.fullName}`,
    });
    return jsonOk({ id: d.id, status: d.status });
  }

  const existing = await db.query.contactMessages.findFirst({
    where: eq(contactMessages.id, d.id),
  });
  if (!existing) return jsonError("Contact message not found", 404);
  await db
    .update(contactMessages)
    .set({
      status: d.status as typeof existing.status,
      repliedAt: d.status === "replied" ? new Date() : existing.repliedAt,
    })
    .where(eq(contactMessages.id, d.id));
  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "requests.contact_status",
    entityType: "contact_message",
    entityId: d.id,
    summary: `Contact message ${d.status} from ${existing.name}`,
  });
  return jsonOk({ id: d.id, status: d.status });
}
