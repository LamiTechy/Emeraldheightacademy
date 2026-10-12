"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, SunMoonIcon } from "lucide-react";

// Subscribes to nothing: client snapshot is true after hydration, server false.
function subscribe() {
  return () => {};
}

const mounted = () => true;
const serverSnapshot = () => false;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(subscribe, mounted, serverSnapshot);

  if (!isMounted) {
    return <Button variant="ghost" size="icon-sm" className={className} aria-label="Toggle theme" />;
  }

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "dark" ? MoonIcon : theme === "light" ? SunIcon : SunMoonIcon;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      title={`Theme: ${theme} → ${next}`}
      onClick={() => setTheme(next)}
    >
      <Icon />
    </Button>
  );
}
