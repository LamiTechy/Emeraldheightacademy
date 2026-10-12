import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { requireApiRole } from "@/lib/auth/api-guard";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { setSetting } from "@/lib/settings";

const keySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/, "Use lowercase letters, digits and underscores");

const createSchema = z.object({
  key: keySchema,
  value: z.unknown(),
});

/** POST /api/admin/settings — create a new setting key. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const { key, value } = parsed.data;

  const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  if (existing) return jsonError("That setting key already exists", 409);

  await setSetting(key, value, admin.id);

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.setting_created",
    entityType: "setting",
    entityId: key,
    summary: `Created setting “${key}”`,
  });

  return jsonOk({ key });
}
