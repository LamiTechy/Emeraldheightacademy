import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./helpers";
import {
  announcementScopeEnum,
  contactStatusEnum,
  educationLevelEnum,
  registrationStatusEnum,
  trialStatusEnum,
  userRoleEnum,
} from "./enums";
import { batches, courses } from "./academics";
import { students, users } from "./users";

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    scope: announcementScopeEnum("scope").notNull().default("global"),
    audienceRole: userRoleEnum("audience_role"),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id").references(() => batches.id, { onDelete: "cascade" }),
    pinned: boolean("pinned").notNull().default(false),
    publishAt: timestamp("publish_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("announcements_scope_publish_idx").on(t.scope, t.publishAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => messages.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_recipient_read_idx").on(t.recipientId, t.readAt),
    index("messages_sender_idx").on(t.senderId),
    index("messages_parent_idx").on(t.parentId),
  ],
);

export const registrationRequests = pgTable(
  "registration_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email"),
    phone: text("phone").notNull(),
    courseIds: uuid("course_ids").array().notNull().default([]),
    preferredSchedule: text("preferred_schedule"),
    educationLevel: educationLevelEnum("education_level"),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    guardianRelationship: text("guardian_relationship"),
    message: text("message"),
    status: registrationStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("registration_requests_status_idx").on(t.status)],
);

export const trialRequests = pgTable(
  "trial_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    courseInterest: text("course_interest").notNull(),
    preferredDate: date("preferred_date"),
    message: text("message"),
    status: trialStatusEnum("status").notNull().default("new"),
    handledBy: uuid("handled_by").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("trial_requests_status_idx").on(t.status)],
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: contactStatusEnum("status").notNull().default("new"),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("contact_messages_status_idx").on(t.status)],
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [announcements.courseId],
    references: [courses.id],
  }),
  batch: one(batches, {
    fields: [announcements.batchId],
    references: [batches.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "messageSender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "messageRecipient",
  }),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id],
    relationName: "messageParent",
  }),
}));

export const registrationRequestsRelations = relations(registrationRequests, ({ one }) => ({
  reviewer: one(users, {
    fields: [registrationRequests.reviewedBy],
    references: [users.id],
  }),
  student: one(students, {
    fields: [registrationRequests.studentId],
    references: [students.id],
  }),
}));

export const trialRequestsRelations = relations(trialRequests, ({ one }) => ({
  handler: one(users, {
    fields: [trialRequests.handledBy],
    references: [users.id],
  }),
}));
