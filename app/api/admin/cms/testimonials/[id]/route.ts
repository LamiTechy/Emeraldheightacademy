import { eq } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateTestimonialSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Update a testimonial (approve, feature, edit). */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateTestimonialSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { id } = await params;
  const existing = await db.query.testimonials.findFirst({ where: eq(testimonials.id, id) });
  if (!existing) return jsonError("Testimonial not found", 404);

  const d = parsed.data;
  await db
    .update(testimonials)
    .set({
      name: d.name ?? existing.name,
      program: d.program !== undefined ? d.program || null : existing.program,
      quote: d.quote ?? existing.quote,
      photoUrl: d.photoUrl !== undefined ? d.photoUrl || null : existing.photoUrl,
      rating: d.rating !== undefined ? d.rating : existing.rating,
      featured: d.featured ?? existing.featured,
      approved: d.approved ?? existing.approved,
      sortOrder: d.sortOrder ?? existing.sortOrder,
    })
    .where(eq(testimonials.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.testimonial_updated",
    entityType: "testimonial",
    entityId: id,
    summary: `Updated testimonial from “${existing.name}”`,
  });

  return jsonOk({ id });
}

/** Delete a testimonial. */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { id } = await params;
  const existing = await db.query.testimonials.findFirst({ where: eq(testimonials.id, id) });
  if (!existing) return jsonError("Testimonial not found", 404);

  await db.delete(testimonials).where(eq(testimonials.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.testimonial_deleted",
    entityType: "testimonial",
    entityId: id,
    summary: `Deleted testimonial from “${existing.name}”`,
  });

  return jsonOk({ id });
}
