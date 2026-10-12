import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, isUniqueViolation } from "@/lib/api";
import { createCourseSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/format";

/** Create a course. Slug is derived from the name (with a numeric suffix if taken). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createCourseSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const baseSlug = slugify(data.name) || "course";
  let slug = baseSlug;
  for (let i = 2; ; i++) {
    const taken = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
      columns: { id: true },
    });
    if (!taken) break;
    slug = `${baseSlug}-${i}`;
  }

  try {
    const [row] = await db
      .insert(courses)
      .values({
        code: data.code.toUpperCase(),
        name: data.name,
        slug,
        category: data.category,
        description: data.description,
        longDescription: data.longDescription ?? null,
        durationWeeks: data.durationWeeks ?? null,
        scheduleSummary: data.scheduleSummary ?? null,
        mode: data.mode,
        status: data.status,
        featured: data.featured,
        sortOrder: data.sortOrder,
      })
      .returning({ id: courses.id, code: courses.code });

    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: "admin.course_created",
      entityType: "course",
      entityId: row!.id,
      summary: `Created course ${row!.code}`,
    });

    return jsonOk({ id: row!.id });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A course with that code already exists", 409, {
        fieldErrors: { code: ["Code already in use"] },
      });
    }
    throw error;
  }
}
