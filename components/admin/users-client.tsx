"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoleBadge, StatusBadge } from "@/components/shared/badges";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { UserForm } from "@/components/admin/user-form";
import type { UserView } from "@/components/admin/types";
import { apiRequest } from "@/lib/client-api";
import { formatDate, timeAgo } from "@/lib/format";
import {
  BanIcon,
  CheckIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

export function UsersClient({ rows }: { rows: UserView[] }) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; user?: UserView }>(
    null,
  );
  const [resetTarget, setResetTarget] = React.useState<UserView | null>(null);
  const [resetPassword, setResetPassword] = React.useState("");
  const [suspendTarget, setSuspendTarget] = React.useState<UserView | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserView | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function toggleSuspend(user: UserView) {
    setBusy(true);
    try {
      const next = user.status === "suspended" ? "active" : "suspended";
      const result = await apiRequest(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: { status: next },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(next === "suspended" ? "Account suspended" : "Account reactivated");
      router.refresh();
    } finally {
      setBusy(false);
      setSuspendTarget(null);
    }
  }

  async function removeUser(user: UserView) {
    setBusy(true);
    try {
      const result = await apiRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Account deleted");
      router.refresh();
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  async function submitReset() {
    if (!resetTarget) return;
    setBusy(true);
    try {
      const result = await apiRequest(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: "POST",
        body: { password: resetPassword },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Password reset — share it securely with the user");
      setResetTarget(null);
      setResetPassword("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<UserView>[] = [
    {
      key: "name",
      header: "Name",
      value: (r) => `${r.name} ${r.email}`,
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{r.name}</span>
          <span className="truncate text-xs text-muted-foreground">{r.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      value: (r) => r.role,
      cell: (r) => <RoleBadge role={r.role} />,
    },
    {
      key: "status",
      header: "Status",
      value: (r) => r.status,
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge status={r.status} />
          {r.mustChangePassword ? (
            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              pwd reset due
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "code",
      header: "ID",
      value: (r) => r.studentId ?? r.tutorId ?? "",
      cell: (r) => (
        <span className="font-mono text-xs">{r.studentId ?? r.tutorId ?? "—"}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      value: (r) => r.phone ?? "",
      cell: (r) => r.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "lastLogin",
      header: "Last login",
      value: (r) => r.lastLoginAt ?? "",
      cell: (r) =>
        r.lastLoginAt ? (
          <span title={formatDate(r.lastLoginAt)}>{timeAgo(r.lastLoginAt)}</span>
        ) : (
          <span className="text-muted-foreground">Never</span>
        ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="role"
          label="Filter by role"
          options={[
            { value: "student", label: "Students" },
            { value: "tutor", label: "Tutors" },
            { value: "admin", label: "Admins" },
          ]}
          placeholder="All roles"
        />
        <UrlFilterSelect
          param="status"
          label="Filter by status"
          options={[
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "suspended", label: "Suspended" },
          ]}
          placeholder="All statuses"
        />
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> New user
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        searchPlaceholder="Search name or email…"
        searchValue={(r) => `${r.name} ${r.email} ${r.phone ?? ""} ${r.studentId ?? ""} ${r.tutorId ?? ""}`}
        exportFileName="users"
        emptyTitle="No users match"
        actions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", user: r })}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setResetTarget(r)}>
                <KeyRoundIcon /> Reset password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setSuspendTarget(r)}
                disabled={r.status === "pending"}
              >
                {r.status === "suspended" ? (
                  <>
                    <CheckIcon /> Reactivate
                  </>
                ) : (
                  <>
                    <BanIcon /> Suspend
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(r)}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{sheet?.mode === "edit" ? "Edit user" : "New user"}</SheetTitle>
            <SheetDescription>
              {sheet?.mode === "edit"
                ? "Update account details and profile."
                : "Create a student, tutor or admin account."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <UserForm
                key={sheet.user?.id ?? "new"}
                mode={sheet.mode}
                user={sheet.user}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={resetTarget !== null} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a temporary password for {resetTarget?.name}. Their sessions will be revoked and
              they must change it on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-pw">New password</Label>
            <Input
              id="reset-pw"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Min 8 chars, upper + lower + number"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitReset()} disabled={busy || !resetPassword}>
              {busy ? "Saving…" : "Reset password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={suspendTarget !== null}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
        title={suspendTarget?.status === "suspended" ? "Reactivate account?" : "Suspend account?"}
        description={
          suspendTarget?.status === "suspended"
            ? `${suspendTarget?.name} will be able to sign in again.`
            : `${suspendTarget?.name} will be signed out everywhere and blocked from logging in.`
        }
        confirmLabel={suspendTarget?.status === "suspended" ? "Reactivate" : "Suspend"}
        destructive={suspendTarget?.status !== "suspended"}
        onConfirm={() => { if (suspendTarget) void toggleSuspend(suspendTarget); }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this account?"
        description={`${deleteTarget?.name} (${deleteTarget?.email}) will be removed from lists and signed out everywhere. Their learning records are kept.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) void removeUser(deleteTarget); }}
      />
    </>
  );
}
