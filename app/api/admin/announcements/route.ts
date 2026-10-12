import { db } from "@/db";
import { announcements } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createAnnouncementSchema } from "@/lib/validators/comms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { listAllAnnouncements, listScopeOptions } from "@/lib/queries/comms";

/** List all announcements + scope options (admin). */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const [rows, options] = await Promise.all([listAllAnnouncements(), listScopeOptions()]);
  return jsonOk({ announcements: rows, options });
}

/** Create an announcement (admin). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createAnnouncementSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const [row] = await db
    .insert(announcements)
    .values({
      authorId: admin.id,
      title: d.title,
      body: d.body,
      scope: d.scope,
      audienceRole: d.audienceRole ?? null,
      courseId: d.courseId ?? null,
      batchId: d.batchId ?? null,
      pinned: d.pinned,
      publishAt: d.publishAt ?? new Date(),
    })
    .returning({ id: announcements.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.announcement_created",
    entityType: "announcement",
    entityId: row!.id,
    summary: `Published announcement “${d.title}” (${d.scope})`,
  });

  return jsonOk({ id: row!.id });
}
