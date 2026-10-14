import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublicCourses } from "@/lib/queries/public";
import { ClockIcon, UsersIcon } from "lucide-react";

export const metadata = { title: "Courses" };

/** Course list comes from the database — render on demand. */
export const instant = false;

export default async function CoursesPage() {
  const courses = await listPublicCourses();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Our courses</h1>
        <p className="mt-2 text-muted-foreground">
          Exam preparation and school enrichment — taught in person at our Abeokuta centre.
        </p>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Course catalogue coming soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="card-hover flex flex-col rounded-2xl border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge className="bg-brand-soft text-primary border-none dark:bg-primary/20 dark:text-indigo-200">{c.code}</Badge>
                </div>
                <CardTitle className="text-base">{c.name}</CardTitle>
                <CardDescription className="capitalize">
                  {c.category.replace(/_/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3.5" /> {c.durationWeeks ?? "—"} weeks
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UsersIcon className="size-3.5" /> Small batches
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
