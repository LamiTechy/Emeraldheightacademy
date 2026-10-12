export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { AuditClient, type AuditRowView } from "@/components/admin/audit-client";
import { requireUser } from "@/lib/auth/session";
import { listAuditLogs } from "@/lib/queries/admin";
import { userRoleEnum } from "@/db/schema";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser("admin");
  const sp = await searchParams;

  const roleParam = typeof sp.role === "string" ? sp.role : null;
  const role = roleParam
    ? userRoleEnum.enumValues.find((v) => v === roleParam)
    : undefined;

  const rows = await listAuditLogs({ role });

  const views: AuditRowView[] = rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    summary: r.summary,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    ip: r.ip,
    userAgent: r.userAgent,
    actorRole: r.actorRole,
    actorName: r.actorName,
    actorEmail: r.actorEmail,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Every recorded action across the portal — newest first (last 500)."
      />
      <AuditClient rows={views} />
    </>
  );
}
