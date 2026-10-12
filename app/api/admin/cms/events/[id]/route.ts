import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateEventSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Update an event. */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateEventSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { id } = await params;
  const existing = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!existing) return jsonError("Event not found", 404);

  const d = parsed.data;
  await db
    .update(events)
    .set({
      title: d.title ?? existing.title,
      description: d.description ?? existing.description,
      coverImageUrl: d.coverImageUrl !== undefined ? d.coverImageUrl || null : existing.coverImageUrl,
      location: d.location !== undefined ? d.location || null : existing.location,
      startsAt: d.startsAt ?? existing.startsAt,
      endsAt: d.endsAt !== undefined ? d.endsAt : existing.endsAt,
      status: d.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.event_updated",
    entityType: "event",
    entityId: id,
    summary: `Updated event “${existing.title}”`,
  });

  return jsonOk({ id });
}

/** Delete an event. */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { id } = await params;
  const existing = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!existing) return jsonError("Event not found", 404);

  await db.delete(events).where(eq(events.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.event_deleted",
    entityType: "event",
    entityId: id,
    summary: `Deleted event “${existing.title}”`,
  });

  return jsonOk({ id });
}
