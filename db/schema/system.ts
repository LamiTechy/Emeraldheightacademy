import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt } from "./helpers";
import { userRoleEnum } from "./enums";
import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorRole: userRoleEnum("actor_role"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId, t.createdAt),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_idx").on(t.createdAt),
    index("audit_logs_action_idx").on(t.action),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [settings.updatedBy],
    references: [users.id],
  }),
}));
