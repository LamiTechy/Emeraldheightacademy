"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SlotForm } from "@/components/admin/slot-form";
import type { FormOptions, SlotView } from "@/components/admin/types";
import { apiRequest } from "@/lib/client-api";
import { DAY_SHORT, WEEK_ORDER, shortTime } from "@/lib/format";
import { MapPinIcon, MoreHorizontalIcon, PlusIcon, Trash2Icon, UserIcon } from "lucide-react";

export function TimetableClient({
  rows,
  options,
}: {
  rows: SlotView[];
  options: FormOptions;
}) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<null | { mode: "create" | "edit"; slot?: SlotView }>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<SlotView | null>(null);

  async function removeSlot(slot: SlotView) {
    try {
      const result = await apiRequest(`/api/admin/timetable/${slot.id}`, { method: "DELETE" });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Session removed");
      router.refresh();
    } finally {
      setDeleteTarget(null);
    }
  }

  const byDay = new Map<number, SlotView[]>();
  for (const day of WEEK_ORDER) byDay.set(day, []);
  for (const slot of rows) {
    (byDay.get(slot.dayOfWeek) ?? byDay.set(slot.dayOfWeek, []).get(slot.dayOfWeek)!).push(slot);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <p className="text-sm text-muted-foreground">
          Weekly recurring sessions. Overlapping sessions for the same tutor are blocked.
        </p>
        <Button size="sm" className="ml-auto" onClick={() => setSheet({ mode: "create" })}>
          <PlusIcon /> Add session
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {WEEK_ORDER.map((day) => {
          const slots = byDay.get(day) ?? [];
          return (
            <Card key={day} className="min-h-40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {DAY_SHORT[day]}
                  <span className="ml-1.5 text-xs font-normal">({slots.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {slots.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No sessions</p>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="group relative rounded-lg border bg-background p-2.5 text-sm shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {shortTime(slot.startTime)}–{shortTime(slot.endTime)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Actions for ${slot.batchCode}`}
                              className="opacity-60 group-hover:opacity-100"
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onSelect={() => setSheet({ mode: "edit", slot })}>
                              Edit session
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(slot)}>
                              <Trash2Icon /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="mt-1 truncate font-medium">{slot.batchName}</p>
                      <p className="truncate text-xs text-muted-foreground">{slot.courseName}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <UserIcon className="size-3" />
                        <span className="truncate">{slot.tutorName}</span>
                      </div>
                      {slot.room ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPinIcon className="size-3" />
                          <span className="truncate">{slot.room}</span>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{sheet?.mode === "edit" ? "Edit session" : "Add session"}</SheetTitle>
            <SheetDescription>
              A weekly recurring slot on the centre timetable.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {sheet ? (
              <SlotForm
                key={sheet.slot?.id ?? "new"}
                mode={sheet.mode}
                slot={sheet.slot}
                options={options}
                onDone={() => setSheet(null)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this session?"
        description={`${deleteTarget?.batchCode} on ${deleteTarget ? DAY_SHORT[deleteTarget.dayOfWeek] : ""} at ${deleteTarget ? shortTime(deleteTarget.startTime) : ""} will be removed from the timetable.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) void removeSlot(deleteTarget); }}
      />
    </>
  );
}
