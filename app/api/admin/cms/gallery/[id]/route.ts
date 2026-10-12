import { eq } from "drizzle-orm";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateGalleryItemSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/** Update a gallery item. */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateGalleryItemSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const { id } = await params;
  const existing = await db.query.galleryItems.findFirst({ where: eq(galleryItems.id, id) });
  if (!existing) return jsonError("Gallery item not found", 404);

  const d = parsed.data;
  await db
    .update(galleryItems)
    .set({
      title: d.title ?? existing.title,
      caption: d.caption !== undefined ? d.caption || null : existing.caption,
      imageUrl: d.imageUrl ?? existing.imageUrl,
      category: d.category ?? existing.category,
      sortOrder: d.sortOrder ?? existing.sortOrder,
    })
    .where(eq(galleryItems.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.gallery_updated",
    entityType: "gallery_item",
    entityId: id,
    summary: `Updated gallery item “${existing.title}”`,
  });

  return jsonOk({ id });
}

/** Delete a gallery item. */
export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { id } = await params;
  const existing = await db.query.galleryItems.findFirst({ where: eq(galleryItems.id, id) });
  if (!existing) return jsonError("Gallery item not found", 404);

  await db.delete(galleryItems).where(eq(galleryItems.id, id));

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.gallery_deleted",
    entityType: "gallery_item",
    entityId: id,
    summary: `Deleted gallery item “${existing.title}”`,
  });

  return jsonOk({ id });
}
