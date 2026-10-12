import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import type {
  courseCategoryEnum,
  courseModeEnum,
  userRoleEnum,
} from "@/db/schema";

type Role = (typeof userRoleEnum.enumValues)[number];
type Category = (typeof courseCategoryEnum.enumValues)[number];
type Mode = (typeof courseModeEnum.enumValues)[number];

const ROLE_TONE: Record<Role, string> = {
  admin: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  tutor: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  student: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
};

const STATUS_TONE: Record<string, string> = {
  active: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  published: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  completed: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  upcoming: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  waitlisted: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  suspended: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  dropped: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  archived: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  inactive: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  draft: "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  graded: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  present: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  absent: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  late: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  excused: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  submitted: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  returned: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  closed: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  note: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  past_question: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  video: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  link: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
};

function toneFor(value: string): string {
  return STATUS_TONE[value] ?? "border-border bg-muted text-muted-foreground";
}

const titleize = (v: string) =>
  v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={cn("font-medium", ROLE_TONE[role])}>
      {titleize(role)}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", toneFor(status))}>
      {titleize(status)}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <Badge variant="outline" className="font-medium">
      {titleize(category)}
    </Badge>
  );
}

export function ModeBadge({ mode }: { mode: Mode }) {
  return (
    <Badge variant="secondary" className="font-medium">
      {titleize(mode)}
    </Badge>
  );
}
