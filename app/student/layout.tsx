export const instant = false;

import { PortalShell } from "@/components/layout/portal-shell";
import { requireUser } from "@/lib/auth/session";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("student");
  return (
    <PortalShell
      role="student"
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
