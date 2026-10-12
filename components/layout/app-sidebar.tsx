"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ROLE_LABEL, portalNav, type NavSection } from "@/components/layout/portal-nav";
import { UserNav, type PortalUser } from "@/components/layout/user-nav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Role } from "@/lib/auth/jwt";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string, portalHome: string): boolean {
  if (href === portalHome) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSectionGroup({ section, role }: { section: NavSection; role: Role }) {
  const pathname = usePathname();
  const portalHome = `/${role}`;

  return (
    <SidebarGroup>
      {section.label ? <SidebarGroupLabel>{section.label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(pathname, item.href, portalHome)}
                tooltip={item.title}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ role, user }: { role: Role; user: PortalUser }) {
  const sections = portalNav[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center">
          <Link href={`/${role}`} className="flex items-center gap-2" aria-label="Home">
            <Logo showWordmark={false} />
          </Link>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-heading text-sm font-bold tracking-tight">
              {ROLE_LABEL[role]}
            </span>
            <span className="text-[11px] text-muted-foreground">Emerald Height Academy</span>
          </div>
        </div>
        <SidebarSeparator className="mx-0" />
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section, i) => (
          <NavSectionGroup key={section.label ?? `section-${i}`} section={section} role={role} />
        ))}
      </SidebarContent>

      <SidebarFooter className="pb-12">
        <Separator className="mx-0 mb-1" />
        <div className="flex items-center gap-2 px-2 pb-1 group-data-[collapsible=icon]:hidden">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            {ROLE_LABEL[user.role]}
          </Badge>
        </div>
        <div className={cn("px-1", "group-data-[collapsible=icon]:px-0")}>
          <UserNav user={user} variant="sidebar" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
