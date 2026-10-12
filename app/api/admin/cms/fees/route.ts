import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { updateFeesInfoSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { getSetting, setSetting } from "@/lib/settings";

type FeesInfo = { title: string; body: string; lastUpdated: string | null };

/** GET /api/admin/cms/fees — current fees info setting. */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const fees = await getSetting<FeesInfo | null>("fees_info", null);
  return jsonOk({ fees });
}

/** PATCH /api/admin/cms/fees — update the public Fees & How to Pay page text. */
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, updateFeesInfoSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const next: FeesInfo = {
    title: d.title,
    body: d.body,
    lastUpdated: new Date().toISOString(),
  };
  await setSetting("fees_info", next, admin.id);

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.fees_updated",
    entityType: "setting",
    entityId: "fees_info",
    summary: "Updated the public Fees & How to Pay page",
  });

  return jsonOk({ fees: next });
}
