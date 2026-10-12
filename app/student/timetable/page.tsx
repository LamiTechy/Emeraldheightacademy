export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listStudentWeek } from "@/lib/queries/student";
import { DAY_SHORT, WEEK_ORDER, shortTime } from "@/lib/format";

export default async function StudentTimetablePage() {
  const user = await requireUser("student");
  const week = user.studentRowId ? await listStudentWeek(user.studentRowId) : [];

  const byDay = new Map<number, typeof week>();
  for (const row of week) {
    const list = byDay.get(row.slot.dayOfWeek) ?? [];
    list.push(row);
    byDay.set(row.slot.dayOfWeek, list);
  }

  return (
    <>
      <PageHeader title="Timetable" description="Your weekly class schedule." />

      {week.length === 0 ? (
        <EmptyState
          title="No classes scheduled"
          description="Once your batch timetable is published, your classes appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WEEK_ORDER.map((day) => {
            const slots = byDay.get(day) ?? [];
            return (
              <Card key={day} className={slots.length === 0 ? "opacity-60" : undefined}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{DAY_SHORT[day]}</CardTitle>
                </CardHeader>
                <CardContent>
                  {slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No classes</p>
                  ) : (
                    <ul className="divide-y">
                      {slots.map(({ slot, course, batch }) => (
                        <li key={slot.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{course.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {batch.code} · {slot.room ?? "Room TBA"}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {shortTime(slot.startTime)}–{shortTime(slot.endTime)}
                          </span>
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
