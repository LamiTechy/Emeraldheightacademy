"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UrlFilterSelectProps = {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
  width?: string;
};

/**
 * Select that writes its value into a URL search param (RSC-friendly filters).
 * Use value="__all__" for the "no filter" option.
 * Inner component is wrapped in Suspense so useSearchParams never breaks prerender.
 */
export function UrlFilterSelect(props: UrlFilterSelectProps) {
  return (
    <Suspense
      fallback={
        <div className={`${props.width ?? "w-[160px]"} h-8 rounded-md border bg-muted`} />
      }
    >
      <UrlFilterSelectInner {...props} />
    </Suspense>
  );
}

function UrlFilterSelectInner({
  param,
  label,
  options,
  placeholder = "All",
  defaultValue = "__all__",
  width = "w-[160px]",
}: UrlFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? defaultValue;

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) params.delete(param);
    else params.set(param, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger size="sm" className={width} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={defaultValue}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
