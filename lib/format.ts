import { format, formatDistanceToNow } from "date-fns";

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function formatDate(value: Date | string | number): string {
  return format(new Date(value), "dd MMM yyyy");
}

export function formatDateTime(value: Date | string | number): string {
  return format(new Date(value), "dd MMM yyyy, h:mm a");
}

export function formatTime(value: Date | string | number): string {
  return format(new Date(value), "h:mm a");
}

export function timeAgo(value: Date | string | number): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

const numberFormatter = new Intl.NumberFormat("en-NG");
const compactFormatter = new Intl.NumberFormat("en-NG", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/** Naira amount. Used only for display text (e.g. CMS fee info) — never payments. */
export function formatNaira(value: number): string {
  return currencyFormatter.format(value);
}

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function plural(n: number, singular: string, pluralWord?: string): string {
  return n === 1 ? singular : (pluralWord ?? `${singular}s`);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/** "16:00" | "16:00:00" → "16:00:00" (Postgres time). */
export function normalizeTime(value: string): string {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return value;
  return `${m[1]!.padStart(2, "0")}:${m[2]}:${m[3] ?? "00"}`;
}

/** "09:00:00" → "9:00 AM"-ish short label is done at render; this trims seconds. */
export function shortTime(value: string): string {
  return value.length === 8 ? value.slice(0, 5) : value;
}

/** Day-of-week numbering matches JS Date.getDay(): 0 = Sunday … 6 = Saturday. */
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Mon-first ordering for weekly displays. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function formatDays(days: number[]): string {
  if (days.length === 0) return "—";
  const sorted = [...days].sort((a, b) => WEEK_ORDER.indexOf(a as never) - WEEK_ORDER.indexOf(b as never));
  return sorted.map((d) => DAY_SHORT[d] ?? String(d)).join(", ");
}
