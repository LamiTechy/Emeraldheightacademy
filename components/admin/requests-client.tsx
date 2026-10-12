"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2Icon, PhoneIcon, XCircleIcon } from "lucide-react";

export type RegistrationRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  courseIds: string[];
  preferredSchedule: string | null;
  message: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
};

export type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
};

async function updateStatus(kind: "registration" | "contact", id: string, status: string) {
  return apiRequest("/api/admin/requests", { method: "PATCH", body: { kind, id, status } });
}

export function RequestsClient({
  registrations,
  contacts,
}: {
  registrations: RegistrationRow[];
  contacts: ContactRow[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function setStatus(kind: "registration" | "contact", id: string, status: string) {
    setBusyId(id);
    try {
      const result = await updateStatus(kind, id, status);
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success(`Marked ${status}`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Registrations ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Registration requests</CardTitle>
          <CardDescription>{registrations.length} total — approve, reject or follow up.</CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registration requests yet.</p>
          ) : (
            <div className="space-y-3">
              {registrations.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{r.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {r.phone}
                        {r.email ? ` · ${r.email}` : ""}
                      </p>
                      {r.preferredSchedule ? (
                        <p className="text-xs text-muted-foreground">Schedule: {r.preferredSchedule}</p>
                      ) : null}
                      {r.message ? <p className="mt-1 text-sm">{r.message}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => void setStatus("registration", r.id, "approved")}
                        >
                          <CheckCircle2Icon /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === r.id}
                          onClick={() => void setStatus("registration", r.id, "rejected")}
                        >
                          <XCircleIcon /> Reject
                        </Button>
                      </>
                    ) : (
                      <Select
                        value={r.status}
                        onValueChange={(v) => void setStatus("registration", r.id, v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="waitlisted">Waitlisted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {r.phone ? (
                      <Button asChild size="sm" variant="ghost">
                        <a href={`tel:${r.phone.replace(/\s/g, "")}`}>
                          <PhoneIcon /> Call
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Contacts ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Contact messages</CardTitle>
          <CardDescription>{contacts.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contact messages yet.</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{c.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.name} · {c.email}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{c.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Select value={c.status} onValueChange={(v) => void setStatus("contact", c.id, v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button asChild size="sm" variant="ghost">
                      <a href={`mailto:${c.email}`}>
                        Reply <Badge variant="outline">email</Badge>
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
