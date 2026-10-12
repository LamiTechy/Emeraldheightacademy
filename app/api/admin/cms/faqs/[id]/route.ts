import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateFaqSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Update an FAQ. */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateFaqSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { id } = await params;
  const existing = await db.query.faqs.findFirst({ where: eq(faqs.id, id) });
  if (!existing) return jsonError("FAQ not found", 404);

  const d = parsed.data;
  await db
    .update(faqs)
    .set({
      question: d.question ?? existing.question,
      answer: d.answer ?? existing.answer,
      category: d.category ?? existing.category,
      sortOrder: d.sortOrder ?? existing.sortOrder,
      active: d.active ?? existing.active,
      updatedAt: new Date(),
    })
    .where(eq(faqs.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.faq_updated",
    entityType: "faq",
    entityId: id,
    summary: `Updated FAQ “${existing.question}”`,
  });

  return jsonOk({ id });
}

/** Delete an FAQ. */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { id } = await params;
  const existing = await db.query.faqs.findFirst({ where: eq(faqs.id, id) });
  if (!existing) return jsonError("FAQ not found", 404);

  await db.delete(faqs).where(eq(faqs.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.faq_deleted",
    entityType: "faq",
    entityId: id,
    summary: `Deleted FAQ “${existing.question}”`,
  });

  return jsonOk({ id });
}
