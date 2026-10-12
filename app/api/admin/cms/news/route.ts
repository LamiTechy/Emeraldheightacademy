import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { news } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createNewsSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/format";

/** List all news (including drafts) for the CMS. */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const rows = await db.select().from(news).orderBy(desc(news.createdAt));
  return jsonOk({ news: rows });
}

/** Create a news article. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createNewsSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const slug = d.slug ?? slugify(d.title);
  const existing = await db.query.news.findFirst({ where: eq(news.slug, slug) });
  if (existing) return jsonError("A news item with a similar title already exists", 409, {
    fieldErrors: { slug: ["Pick a different title or set a custom slug"] },
  });

  const [row] = await db
    .insert(news)
    .values({
      title: d.title,
      slug,
      excerpt: d.excerpt || null,
      body: d.body,
      coverImageUrl: d.coverImageUrl || null,
      authorId: admin.id,
      published: d.published,
      publishedAt: d.published ? new Date() : null,
    })
    .returning({ id: news.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.news_created",
    entityType: "news",
    entityId: row!.id,
    summary: `Created news “${d.title}”`,
  });

  return jsonOk({ id: row!.id, slug });
}
