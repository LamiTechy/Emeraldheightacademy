import { timestamp } from "drizzle-orm/pg-core";

export function createdAt() {
  return timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow();
}

export function updatedAt() {
  return timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow();
}
