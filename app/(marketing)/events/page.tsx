import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublicEvents } from "@/lib/queries/public";
import { formatDateTime } from "@/lib/format";
import { CalendarIcon, MapPinIcon } from "lucide-react";

export const metadata = { title: "Events" };

/** Events come from the database — render on demand. */
export const instant = false;

const statusTone: Record<string, string> = {
  upcoming: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  ongoing: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
};

export default async function EventsPage() {
  const events = await listPublicEvents(24);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Events</h1>
        <p className="mt-2 text-muted-foreground">
          Open days, mock exams, workshops and more.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="size-4" /> No upcoming events right now — check back soon.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <Card key={e.id}>
              {e.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.coverImageUrl} alt="" className="aspect-video w-full rounded-t-xl object-cover" />
              ) : null}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <Badge variant="outline" className={statusTone[e.status] ?? undefined}>
                    {e.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <CalendarIcon className="size-3.5" /> {formatDateTime(e.startsAt)}
                  {e.endsAt ? ` – ${formatDateTime(e.endsAt)}` : ""}
                </CardDescription>
                {e.location ? (
                  <CardDescription className="flex items-center gap-1">
                    <MapPinIcon className="size-3.5" /> {e.location}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{e.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
