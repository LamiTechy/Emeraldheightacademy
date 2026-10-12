"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "cn";

export type SearchSelectOption = {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
};

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled = false,
  className,
  allowClear = false,
  clearLabel = "Clear selection",
}: {
  options: SearchSelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
  clearLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {allowClear ? (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <span className={cn("mr-2 flex size-4 items-center justify-center", value === null ? "opacity-100" : "opacity-0")}>
                    <CheckIcon className="size-4" />
                  </span>
                  {clearLabel}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => {
                    onChange(option.value === value && allowClear ? null : option.value);
                    setOpen(false);
                  }}
                >
                  <span className={cn("mr-2 flex size-4 items-center justify-center", option.value === value ? "opacity-100" : "opacity-0")}>
                    <CheckIcon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="truncate text-xs text-muted-foreground">{option.hint}</span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
