"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

export type SettingRowView = {
  key: string;
  value: unknown;
  updatedAt: string;
  updatedByName: string | null;
};

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

function valuePreview(value: unknown): string {
  const s = JSON.stringify(value);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function SettingsClient({ rows }: { rows: SettingRowView[] }) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<SettingRowView | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<SettingRowView | null>(null);

  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [editValue, setEditValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function openCreate() {
    setNewKey("");
    setNewValue("{}");
    setCreating(true);
  }

  function openEdit(row: SettingRowView) {
    setEditTarget(row);
    setEditValue(pretty(row.value));
  }

  function parseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
    try {
      return { ok: true, value: JSON.parse(text) as unknown };
    } catch {
      return { ok: false, error: "Value must be valid JSON" };
    }
  }

  async function createSetting() {
    const key = newKey.trim();
    if (!KEY_PATTERN.test(key)) {
      toast.error("Keys use lowercase letters, digits and underscores");
      return;
    }
    const parsed = parseJson(newValue);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest("/api/admin/settings", {
        method: "POST",
        body: { key, value: parsed.value },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed to create");
        return;
      }
      toast.success(`Created “${key}”`);
      setCreating(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editTarget) return;
    const parsed = parseJson(editValue);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest(`/api/admin/settings/${editTarget.key}`, {
        method: "PATCH",
        body: { value: parsed.value },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed to save");
        return;
      }
      toast.success(`Saved “${editTarget.key}”`);
      setEditTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeSetting() {
    if (!deleteTarget) return;
    const result = await apiRequest(`/api/admin/settings/${deleteTarget.key}`, {
      method: "DELETE",
    });
    if (!result.ok) {
      toast.error(result.error ?? "Failed to delete");
      return;
    }
    toast.success(`Deleted “${deleteTarget.key}”`);
    router.refresh();
  }

  const columns: Column<SettingRowView>[] = [
    {
      key: "key",
      header: "Key",
      value: (r) => r.key,
      cell: (r) => <code className="text-xs font-medium">{r.key}</code>,
    },
    {
      key: "value",
      header: "Value",
      value: (r) => valuePreview(r.value),
      cell: (r) => (
        <span className="block max-w-md truncate font-mono text-xs text-muted-foreground">
          {valuePreview(r.value)}
        </span>
      ),
    },
    {
      key: "updatedByName",
      header: "Updated by",
      value: (r) => r.updatedByName ?? "—",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">{r.updatedByName ?? "—"}</span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated at",
      value: (r) => r.updatedAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDateTime(r.updatedAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.key}
        searchPlaceholder="Search settings…"
        searchValue={(r) => `${r.key} ${valuePreview(r.value)}`}
        exportFileName="settings"
        emptyTitle="No settings stored"
        emptyDescription="Settings created here are available to the app via the settings service."
        actions={(row) => (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.key}`}
              onClick={() => openEdit(row)}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.key}`}
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash2Icon />
            </Button>
          </>
        )}
      />

      <div className="flex justify-end pt-3">
        <Button onClick={openCreate}>
          <PlusIcon /> New setting
        </Button>
      </div>

      {/* Create */}
      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New setting</DialogTitle>
            <DialogDescription>
              Stored as JSON and readable anywhere via the settings service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="setting-key">Key</Label>
              <Input
                id="setting-key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. application_notice"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, digits, underscores — e.g. <code>fees_info</code>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setting-value">Value (JSON)</Label>
              <Textarea
                id="setting-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void createSetting()} disabled={busy}>
              {busy ? "Saving…" : "Create setting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Edit <code className="text-base">{editTarget?.key}</code>
            </DialogTitle>
            <DialogDescription>
              The new value takes effect immediately — the settings cache is cleared on save.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="setting-edit-value">Value (JSON)</Label>
            <Textarea
              id="setting-edit-value"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete “${deleteTarget?.key}”?`}
        description="Anything reading this key will fall back to its built-in default."
        confirmLabel="Delete setting"
        destructive
        onConfirm={() => void removeSetting()}
      />
    </>
  );
}
