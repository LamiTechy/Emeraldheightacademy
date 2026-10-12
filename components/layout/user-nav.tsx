"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABEL } from "@/components/layout/portal-nav";
import type { Role } from "@/lib/auth/jwt";
import { initials } from "@/lib/format";
import { KeyRoundIcon, LogOutIcon, ChevronsUpDownIcon, UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PortalUser = {
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
};

type UserNavProps = {
  user: PortalUser;
  /** "sidebar" = compact footer button; "topbar" = icon-only trigger. */
  variant?: "sidebar" | "topbar";
};

export function UserNav({ user, variant = "topbar" }: UserNavProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setSigningOut(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent"
          >
            <Avatar className="size-8">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-60" />
          </button>
        ) : (
          <Button variant="ghost" size="icon-sm" aria-label="Account menu" className="rounded-full">
            <Avatar className="size-7">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-[11px]">{initials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
            <span className="text-[11px] font-medium text-primary">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/change-password">
            <KeyRoundIcon />
            Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${user.role}`}>
            <UserRoundIcon />
            Portal home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onSelect={(e) => {
            e.preventDefault();
            void handleSignOut();
          }}
          className={cn("cursor-pointer")}
        >
          <LogOutIcon />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
