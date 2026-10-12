import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
