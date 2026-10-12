import { desc } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createTestimonialSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

/** List all testimonials for the CMS. */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const rows = await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  return jsonOk({ testimonials: rows });
}

/** Create a testimonial (typically from public requests — admin adds directly). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createTestimonialSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const [row] = await db
    .insert(testimonials)
    .values({
      name: d.name,
      program: d.program || null,
      quote: d.quote,
      photoUrl: d.photoUrl || null,
      rating: d.rating ?? null,
      featured: d.featured,
      approved: d.approved,
      sortOrder: d.sortOrder,
    })
    .returning({ id: testimonials.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.testimonial_created",
    entityType: "testimonial",
    entityId: row!.id,
    summary: `Added testimonial from “${d.name}”`,
  });

  return jsonOk({ id: row!.id });
}
