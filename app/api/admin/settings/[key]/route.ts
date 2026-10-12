import { eq } from "drizzle-orm";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { clearSettingsCache, setSetting } from "@/lib/settings";

type Params = { params: Promise<{ key: string }> };

const keyPattern = /^[a-z][a-z0-9_]*$/;

/** Keys the dedicated CMS editors own — deleting them would break public pages. */
const PROTECTED_KEYS = new Set(["fees_info"]);

const patchSchema = z.object({ value: z.unknown() });

/** PATCH /api/admin/settings/[key] — replace a setting's JSON value. */
export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { key } = await params;
  if (!keyPattern.test(key)) return jsonError("Invalid setting key", 400);

  const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  if (!existing) return jsonError("Setting not found", 404);

  const parsed = await parseJsonBody(request, patchSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  await setSetting(key, parsed.data.value, admin.id);

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.setting_updated",
    entityType: "setting",
    entityId: key,
    summary: `Updated setting “${key}”`,
  });

  return jsonOk({ key });
}

/** DELETE /api/admin/settings/[key] — remove a setting key. */
export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const { key } = await params;
  if (!keyPattern.test(key)) return jsonError("Invalid setting key", 400);

  if (PROTECTED_KEYS.has(key)) {
    return jsonError(
      "That setting is managed on the Site Content page — edit it there instead of deleting it",
      422,
    );
  }

  const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  if (!existing) return jsonError("Setting not found", 404);

  await db.delete(settings).where(eq(settings.key, key));
  clearSettingsCache();

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.setting_deleted",
    entityType: "setting",
    entityId: key,
    summary: `Deleted setting “${key}”`,
  });

  return jsonOk({ key });
}
