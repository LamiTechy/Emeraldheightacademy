import { asc } from "drizzle-orm";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createGalleryItemSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

/** List gallery items for the CMS. */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const rows = await db
    .select()
    .from(galleryItems)
    .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt));
  return jsonOk({ items: rows });
}

/** Create a gallery item. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createGalleryItemSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const [row] = await db
    .insert(galleryItems)
    .values({
      title: d.title,
      caption: d.caption || null,
      imageUrl: d.imageUrl,
      category: d.category,
      sortOrder: d.sortOrder,
    })
    .returning({ id: galleryItems.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.gallery_created",
    entityType: "gallery_item",
    entityId: row!.id,
    summary: `Added gallery item “${d.title}”`,
  });

  return jsonOk({ id: row!.id });
}
