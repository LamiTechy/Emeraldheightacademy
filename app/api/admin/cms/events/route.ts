import { asc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createEventSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/format";

/** List all events for the CMS. */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const rows = await db.select().from(events).orderBy(asc(events.startsAt));
  return jsonOk({ events: rows });
}

/** Create an event. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createEventSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const slug = d.slug ?? slugify(d.title);
  const [row] = await db
    .insert(events)
    .values({
      title: d.title,
      slug,
      description: d.description,
      coverImageUrl: d.coverImageUrl || null,
      location: d.location || null,
      startsAt: d.startsAt,
      endsAt: d.endsAt ?? null,
      status: d.status,
    })
    .returning({ id: events.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.event_created",
    entityType: "event",
    entityId: row!.id,
    summary: `Created event “${d.title}”`,
  });

  return jsonOk({ id: row!.id, slug });
}
