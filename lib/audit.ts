import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { userRoleEnum } from "@/db/schema";
import type { Role } from "@/lib/auth/jwt";

type AuditInput = {
  actorId?: string | null;
  actorRole?: (typeof userRoleEnum.enumValues)[number] | Role | null;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

/**
 * Fire-and-forget audit logging. Never throws, never blocks the request on
 * failure (a console warning is emitted instead).
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const headerStore = await headers();
      ip =
        headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headerStore.get("x-real-ip") ??
        null;
      userAgent = headerStore.get("user-agent");
    } catch {
      // headers() unavailable (e.g. background script) — fine.
    }

    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      actorRole: (input.actorRole as never) ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? {},
      ip,
      userAgent,
    });
  } catch (error) {
    console.warn("[audit] failed to write audit log:", error);
  }
}
