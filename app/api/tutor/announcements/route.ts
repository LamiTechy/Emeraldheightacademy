import { db } from "@/db";
import { announcements } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createAnnouncementSchema } from "@/lib/validators/comms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { listAnnouncementsForRole, listTutorScopeOptions } from "@/lib/queries/comms";

/** List announcements visible to this tutor + their scope options. */
export async function GET() {
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const [rows, options] = await Promise.all([
    listAnnouncementsForRole("tutor"),
    listTutorScopeOptions(tutor.tutorRowId),
  ]);
  return jsonOk({ announcements: rows, options });
}

/** Create an announcement (tutor). Course/batch must be one they teach. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("tutor");
  if (guard.response) return guard.response;
  const tutor = guard.user;
  if (!tutor.tutorRowId) return jsonError("Tutor profile missing", 403);

  const parsed = await parseJsonBody(request, createAnnouncementSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  if (d.scope === "course" && d.courseId) {
    const mine = await listTutorScopeOptions(tutor.tutorRowId);
    if (!mine.some((r) => r.course.id === d.courseId)) {
      return jsonError("You can only post to courses you teach", 403);
    }
  }
  if (d.scope === "batch" && d.batchId) {
    const options = await listTutorScopeOptions(tutor.tutorRowId);
    if (!options.some((r) => r.batch.id === d.batchId)) {
      return jsonError("You can only post to batches you teach", 403);
    }
  }

  const [row] = await db
    .insert(announcements)
    .values({
      authorId: tutor.id,
      title: d.title,
      body: d.body,
      scope: d.scope,
      audienceRole: d.audienceRole ?? null,
      courseId: d.scope === "course" ? (d.courseId ?? null) : null,
      batchId: d.scope === "batch" ? (d.batchId ?? null) : null,
      pinned: d.pinned,
      publishAt: d.publishAt ?? new Date(),
    })
    .returning({ id: announcements.id });

  await logAudit({
    actorId: tutor.id,
    actorRole: "tutor",
    action: "tutor.announcement_created",
    entityType: "announcement",
    entityId: row!.id,
    summary: `Published announcement “${d.title}” (${d.scope})`,
  });

  return jsonOk({ id: row!.id });
}
