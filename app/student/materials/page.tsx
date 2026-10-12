export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UrlFilterSelect } from "@/components/tables/url-filter-select";
import { requireUser } from "@/lib/auth/session";
import { listStudentMaterials } from "@/lib/queries/student";
import { formatDate } from "@/lib/format";
import { FileTextIcon, ExternalLinkIcon } from "lucide-react";

export default async function StudentMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser("student");
  const { type } = await searchParams;
  const typeFilter = typeof type === "string" && type.length > 0 ? type : null;

  const rows = user.studentRowId
    ? await listStudentMaterials(user.studentRowId).then((all) =>
        typeFilter ? all.filter((r) => r.m.type === typeFilter) : all,
      )
    : [];

  return (
    <>
      <PageHeader title="Materials" description="Notes, slides and recordings from your tutors." />

      <div className="flex flex-wrap items-center gap-2 pb-1">
        <UrlFilterSelect
          param="type"
          label="Filter by type"
          options={[
            { value: "note", label: "Notes" },
            { value: "past_question", label: "Past questions" },
            { value: "video", label: "Videos" },
            { value: "link", label: "Links" },
            { value: "other", label: "Other" },
          ]}
          placeholder="All types"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No materials yet"
          description="Notes, past questions and recordings shared by your tutors appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ m, course, batch }) => (
            <Card key={m.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary">{m.type.replace("_", " ")}</Badge>
                  <StatusBadge status={course.status} />
                </div>
                <CardTitle className="text-base">{m.title}</CardTitle>
                <CardDescription>
                  {course.name}
                  {batch ? ` · ${batch.code}` : " · Whole course"}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-3">
                {m.description ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{m.description}</p>
                ) : null}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(m.createdAt)}</span>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <FileTextIcon className="size-3.5" /> Open
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
