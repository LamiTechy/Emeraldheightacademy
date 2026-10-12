"use client";

import * as React from "react";
import { DataTable, type Column } from "@/components/tables/data-table";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";

export type AuditRowView = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  actorRole: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <Badge variant="outline" className="text-xs font-normal">System</Badge>;
  return (
    <Badge
      variant="secondary"
      className={
        role === "admin"
          ? "bg-primary/10 text-primary text-xs font-medium"
          : "text-xs font-normal capitalize"
      }
    >
      {role}
    </Badge>
  );
}

export function AuditClient({ rows }: { rows: AuditRowView[] }) {
  const [selected, setSelected] = React.useState<AuditRowView | null>(null);

  const columns: Column<AuditRowView>[] = [
    {
      key: "createdAt",
      header: "When",
      value: (r) => r.createdAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      value: (r) => `${r.actorName ?? "System"} ${r.actorRole ?? ""}`,
      cell: (r) => (
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            {r.actorName ?? "System"} <RoleBadge role={r.actorRole} />
          </p>
          {r.actorEmail ? (
            <p className="truncate text-xs text-muted-foreground">{r.actorEmail}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      value: (r) => r.action,
      cell: (r) => <code className="text-xs">{r.action}</code>,
    },
    {
      key: "summary",
      header: "Summary",
      value: (r) => r.summary,
      cell: (r) => <p className="line-clamp-2 max-w-md text-sm">{r.summary}</p>,
    },
    {
      key: "entity",
      header: "Entity",
      value: (r) => `${r.entityType ?? ""} ${r.entityId ?? ""}`.trim(),
      cell: (r) =>
        r.entityType ? (
          <div className="text-xs text-muted-foreground">
            <span>{r.entityType}</span>
            {r.entityId ? (
              <code className="block max-w-[10ch] truncate">{r.entityId.slice(0, 8)}</code>
            ) : null}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "ip",
      header: "IP",
      value: (r) => r.ip ?? "",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{r.ip ?? "—"}</span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        searchPlaceholder="Search actions…"
        searchValue={(r) => `${r.action} ${r.summary} ${r.actorName ?? ""} ${r.actorEmail ?? ""}`}
        exportFileName="audit-log"
        toolbar={
          <UrlFilterSelect
            param="role"
            label="Role"
            options={[
              { value: "__all__", label: "All roles" },
              { value: "admin", label: "Admin" },
              { value: "tutor", label: "Tutor" },
              { value: "student", label: "Student" },
            ]}
          />
        }
        emptyTitle="No audit entries"
        emptyDescription="Recorded actions will appear here as people use the portal."
        onRowClick={(r) => setSelected(r)}
      />

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event details</DialogTitle>
            <DialogDescription>{selected?.summary}</DialogDescription>
          </DialogHeader>
          {selected ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">When</dt>
                <dd>{formatDateTime(selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Actor</dt>
                <dd className="flex items-center gap-1.5">
                  {selected.actorName ?? "System"} <RoleBadge role={selected.actorRole} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Action</dt>
                <dd>
                  <code>{selected.action}</code>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Entity</dt>
                <dd>
                  {selected.entityType ?? "—"}
                  {selected.entityId ? (
                    <code className="ml-1.5">{selected.entityId}</code>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">IP address</dt>
                <dd className="font-mono text-xs">{selected.ip ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">User agent</dt>
                <dd className="break-all font-mono text-xs text-muted-foreground">
                  {selected.userAgent ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Metadata</dt>
                <dd className="mt-1">
                  <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
                    {JSON.stringify(selected.metadata ?? {}, null, 2)}
                  </pre>
                </dd>
              </div>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
