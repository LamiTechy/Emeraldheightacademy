export const instant = false;

import { PortalShell } from "@/components/layout/portal-shell";
import { requireUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  return (
    <PortalShell
      role="admin"
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }}
    >
      {children}
    </PortalShell>
  );
}
