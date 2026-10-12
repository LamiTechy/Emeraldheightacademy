import { jsonOk } from "@/lib/api";
import { clearSessionCookies, getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  await clearSessionCookies();

  if (session) {
    await logAudit({
      actorId: session.sub,
      actorRole: session.role,
      action: "auth.logout",
      entityType: "user",
      entityId: session.sub,
      summary: "User logged out",
    });
  }

  return jsonOk({ message: "Logged out" });
}
