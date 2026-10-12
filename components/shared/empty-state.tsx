import type { ReactNode } from "react";
import { cn } from "cn";
import { InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <InboxIcon className="size-5" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button asChild variant="outline" size="sm">
          <a href={action.href}>{action.label}</a>
        </Button>
      ) : null}
    </div>
  );
}
