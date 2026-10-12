"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchSelect } from "@/components/forms/search-select";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/client-api";
import type {
  AttendanceStatusValue,
  BatchOption,
  ExistingAttendance,
  RosterStudent,
} from "@/components/tutor/types";
import { CheckCheckIcon, SaveIcon } from "lucide-react";

const STATUSES: { value: AttendanceStatusValue; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

function initialMarks(roster: RosterStudent[], existing: ExistingAttendance[]) {
  const byStudent = new Map(existing.map((e) => [e.studentId, e]));
  const statuses: Record<string, AttendanceStatusValue> = {};
  const notes: Record<string, string> = {};
  for (const s of roster) {
    const prev = byStudent.get(s.studentId);
    statuses[s.studentId] = (prev?.status as AttendanceStatusValue | undefined) ?? "present";
    notes[s.studentId] = prev?.notes ?? "";
  }
  return { statuses, notes };
}

export function AttendanceClient({
  batches,
  roster,
  existing,
  selectedBatchId,
  day,
}: {
  batches: BatchOption[];
  roster: RosterStudent[];
  existing: ExistingAttendance[];
  selectedBatchId: string | null;
  day: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [{ statuses, notes }, setDraft] = React.useState(() => initialMarks(roster, existing));

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;
  const counts = React.useMemo(() => {
    const c: Record<AttendanceStatusValue, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const s of roster) c[statuses[s.studentId] ?? "present"] += 1;
    return c;
  }, [roster, statuses]);

  function go(batchId: string | null, nextDay: string) {
    const params = new URLSearchParams();
    if (batchId) params.set("batch", batchId);
    params.set("day", nextDay);
    router.push(`/tutor/attendance?${params.toString()}`);
  }

  function setStatus(studentId: string, status: AttendanceStatusValue) {
    setDraft((d) => ({ ...d, statuses: { ...d.statuses, [studentId]: status } }));
  }

  function setNote(studentId: string, value: string) {
    setDraft((d) => ({ ...d, notes: { ...d.notes, [studentId]: value } }));
  }

  function markAllPresent() {
    setDraft((d) => {
      const next = { ...d.statuses };
      for (const s of roster) next[s.studentId] = "present";
      return { ...d, statuses: next };
    });
  }

  async function save() {
    if (!selectedBatchId || roster.length === 0) return;
    setSaving(true);
    try {
      const result = await apiRequest("/api/tutor/attendance", {
        method: "POST",
        body: {
          batchId: selectedBatchId,
          day,
          entries: roster.map((s) => ({
            studentId: s.studentId,
            status: statuses[s.studentId] ?? "present",
            notes: notes[s.studentId]?.trim() ? notes[s.studentId].trim() : null,
          })),
        },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed to save attendance");
        return;
      }
      toast.success("Attendance saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 pb-1">
        <div className="w-full max-w-xs">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Batch</Label>
          <SearchSelect
            options={batches.map((b) => ({ value: b.id, label: b.label, hint: b.courseName }))}
            value={selectedBatchId}
            onChange={(v) => go(v, day)}
            placeholder="Select a batch…"
            searchPlaceholder="Search batches…"
          />
        </div>
        <div className="w-44">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Date</Label>
          <Input type="date" value={day} onChange={(e) => go(selectedBatchId, e.target.value)} />
        </div>
        {roster.length > 0 ? (
          <>
            <Button variant="outline" size="sm" onClick={markAllPresent}>
              <CheckCheckIcon /> All present
            </Button>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {counts.present} present · {counts.absent} absent · {counts.late} late ·{" "}
                {counts.excused} excused
              </span>
              <Button size="sm" onClick={() => void save()} disabled={saving}>
                <SaveIcon /> {saving ? "Saving…" : "Save attendance"}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {selectedBatch ? (
        <p className="pt-2 text-sm text-muted-foreground">
          {selectedBatch.label}
          {selectedBatch.daysOfWeek.length > 0 ? ` · usually ${selectedBatch.daysOfWeek.join(", ")}` : ""}
        </p>
      ) : null}

      {!selectedBatchId ? (
        <EmptyState
          title="No batches yet"
          description="Once an admin assigns you to a batch, you can mark attendance here."
        />
      ) : roster.length === 0 ? (
        <EmptyState
          title="No active students"
          description="This batch has no active enrollments yet. Students appear here once they are enrolled."
        />
      ) : (
        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s) => {
                    const status = statuses[s.studentId] ?? "present";
                    return (
                      <tr key={s.studentId} className="border-b last:border-0">
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-muted-foreground">{s.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">{s.studentCode}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {STATUSES.map((opt) => (
                              <Button
                                key={opt.value}
                                type="button"
                                size="sm"
                                variant={status === opt.value ? "default" : "outline"}
                                className="h-7 px-2 text-xs"
                                onClick={() => setStatus(s.studentId, opt.value)}
                              >
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Input
                            value={notes[s.studentId] ?? ""}
                            onChange={(e) => setNote(s.studentId, e.target.value)}
                            placeholder="Optional note…"
                            className="h-8 w-44"
                            maxLength={500}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
