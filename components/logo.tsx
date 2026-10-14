import { cn } from "@/lib/utils";
import { LOGO_DATA_URI } from "@/components/logo-data";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_DATA_URI}
          alt="Emerald Height Academy logo"
          width={36}
          height={36}
          className="size-full object-cover"
        />
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
