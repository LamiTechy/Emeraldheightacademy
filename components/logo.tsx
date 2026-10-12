import { cn } from "@/lib/utils";

/**
 * Placeholder logo — swap the internals for the real brand asset.
 * Recommended: replace the monogram with <Image src="/logo.svg" .../> or an <img>.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 font-heading text-sm font-bold tracking-tight text-white shadow-sm"
      >
        EH
      </span>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[15px] font-bold tracking-tight text-foreground">
            Emerald Height Academy
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Excellence in every lesson
          </span>
        </span>
      ) : null}
    </span>
  );
}
