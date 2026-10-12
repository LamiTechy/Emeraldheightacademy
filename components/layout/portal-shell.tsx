"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserNav, type PortalUser } from "@/components/layout/user-nav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/auth/jwt";
import { ROLE_LABEL } from "@/components/layout/portal-nav";

export function PortalShell({
  role,
  user,
  children,
}: {
  role: Role;
  user: PortalUser;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="bg-muted/30 dark:bg-background">
      <AppSidebar role={role} user={user} />
      <SidebarInset className="min-h-svh">
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-5" />
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide md:hidden">
            {ROLE_LABEL[role]}
          </Badge>
          <span className="hidden text-sm font-medium text-muted-foreground md:inline">
            Emerald Height Academy
          </span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Separator orientation="vertical" className="h-5" />
            <UserNav user={user} variant="topbar" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
