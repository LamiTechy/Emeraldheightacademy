export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { SettingsClient, type SettingRowView } from "@/components/admin/settings-client";
import { requireUser } from "@/lib/auth/session";
import { listSettingsRows } from "@/lib/queries/admin";

export default async function AdminSettingsPage() {
  await requireUser("admin");
  const rows = await listSettingsRows();

  const views: SettingRowView[] = rows.map((r) => ({
    key: r.key,
    value: r.value,
    updatedAt: r.updatedAt.toISOString(),
    updatedByName: r.updatedByName,
  }));

  return (
    <>
      <PageHeader
        title="Settings"
        description="Key/value configuration for the site. Public page copy (news, fees, gallery) lives under Site Content."
      />
      <SettingsClient rows={views} />
    </>
  );
}
