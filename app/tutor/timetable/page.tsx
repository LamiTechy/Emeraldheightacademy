export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listTutorWeek } from "@/lib/queries/tutor";
import { DAY_SHORT, WEEK_ORDER, shortTime } from "@/lib/format";
import { MapPinIcon } from "lucide-react";

export default async function TutorTimetablePage() {
  const user = await requireUser("tutor");
  const week = user.tutorRowId ? await listTutorWeek(user.tutorRowId) : [];
  const today = new Date().getDay();

  const byDay = new Map<number, typeof week>();
  for (const row of week) {
    const list = byDay.get(row.slot.dayOfWeek) ?? [];
    list.push(row);
    byDay.set(row.slot.dayOfWeek, list);
  }

  return (
    <>
      <PageHeader title="Timetable" description="Your teaching schedule across batches." />

      {week.length === 0 ? (
        <EmptyState
          title="No classes scheduled"
          description="Once your batches have timetable slots, your teaching week appears here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WEEK_ORDER.map((day) => {
            const slots = byDay.get(day) ?? [];
            return (
              <Card
                key={day}
                className={slots.length === 0 ? "opacity-60" : undefined}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">{DAY_SHORT[day]}</CardTitle>
                    {day === today ? <Badge className="text-xs font-normal">Today</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent>
                  {slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No classes</p>
                  ) : (
                    <ul className="divide-y">
                      {slots.map(({ slot, course, batch }) => (
                        <li key={slot.id} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{course.name}</p>
                            <p className="text-xs text-muted-foreground">{batch.code}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="block text-xs font-medium text-muted-foreground">
                              {shortTime(slot.startTime)}–{shortTime(slot.endTime)}
                            </span>
                            <span className="mt-1 inline-flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                              {slot.room ? (
                                <>
                                  <MapPinIcon className="size-3" /> {slot.room}
                                </>
                              ) : (
                                "Room TBA"
                              )}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
