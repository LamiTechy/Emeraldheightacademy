import { eq } from "drizzle-orm";
import { db } from "@/db";
import { news } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateNewsSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Update a news article. */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateNewsSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { id } = await params;
  const existing = await db.query.news.findFirst({ where: eq(news.id, id) });
  if (!existing) return jsonError("News not found", 404);

  const d = parsed.data;
  const wasPublished = existing.published;
  const nowPublished = d.published ?? existing.published;

  await db
    .update(news)
    .set({
      title: d.title ?? existing.title,
      excerpt: d.excerpt !== undefined ? d.excerpt || null : existing.excerpt,
      body: d.body ?? existing.body,
      coverImageUrl:
        d.coverImageUrl !== undefined ? d.coverImageUrl || null : existing.coverImageUrl,
      published: nowPublished,
      publishedAt:
        nowPublished && !wasPublished ? new Date() : existing.publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(news.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.news_updated",
    entityType: "news",
    entityId: id,
    summary: `Updated news “${existing.title}”`,
  });

  return jsonOk({ id });
}

/** Delete a news article. */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { id } = await params;
  const existing = await db.query.news.findFirst({ where: eq(news.id, id) });
  if (!existing) return jsonError("News not found", 404);

  await db.delete(news).where(eq(news.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.news_deleted",
    entityType: "news",
    entityId: id,
    summary: `Deleted news “${existing.title}”`,
  });

  return jsonOk({ id });
}
