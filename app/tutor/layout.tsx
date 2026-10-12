export const instant = false;

import { PortalShell } from "@/components/layout/portal-shell";
import { requireUser } from "@/lib/auth/session";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("tutor");
  return (
    <PortalShell
      role="tutor"
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
