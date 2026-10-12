import { eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateAnnouncementSchema } from "@/lib/validators/comms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Update title/body/pin/publishAt of an announcement (admin only). */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateAnnouncementSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { id } = await params;
  const existing = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
  if (!existing) return jsonError("Announcement not found", 404);

  const d = parsed.data;
  await db
    .update(announcements)
    .set({
      title: d.title ?? existing.title,
      body: d.body ?? existing.body,
      pinned: d.pinned ?? existing.pinned,
      ...(d.publishAt !== undefined && d.publishAt !== null ? { publishAt: d.publishAt } : {}),
      updatedAt: new Date(),
    })
    .where(eq(announcements.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.announcement_updated",
    entityType: "announcement",
    entityId: id,
    summary: `Updated announcement “${existing.title}”`,
  });

  return jsonOk({ id });
}

/** Delete an announcement (admin only). */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { id } = await params;
  const existing = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
  if (!existing) return jsonError("Announcement not found", 404);

  await db.delete(announcements).where(eq(announcements.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.announcement_deleted",
    entityType: "announcement",
    entityId: id,
    summary: `Deleted announcement “${existing.title}”`,
  });

  return jsonOk({ id });
}
