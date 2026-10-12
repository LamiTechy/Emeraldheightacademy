import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./helpers";
import { educationLevelEnum, genderEnum, userRoleEnum, userStatusEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: userRoleEnum("role").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    /** Bumped on password change/reset & suspension to revoke outstanding JWTs. */
    tokenVersion: integer("token_version").notNull().default(0),
    status: userStatusEnum("status").notNull().default("active"),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    avatarUrl: text("avatar_url"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("users_role_idx").on(t.role),
    index("users_status_idx").on(t.status),
    uniqueIndex("users_phone_key").on(t.phone),
  ],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    studentId: text("student_id").notNull().unique(),
    educationLevel: educationLevelEnum("education_level"),
    gender: genderEnum("gender"),
    dateOfBirth: date("date_of_birth"),
    school: text("school"),
    address: text("address"),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    guardianRelationship: text("guardian_relationship"),
    isMinor: boolean("is_minor").notNull().default(false),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("students_student_id_idx").on(t.studentId)],
);

export const tutors = pgTable(
  "tutors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    tutorId: text("tutor_id").notNull().unique(),
    bio: text("bio"),
    qualifications: text("qualifications"),
    specialties: text("specialties").array(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("tutors_tutor_id_idx").on(t.tutorId)],
);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  title: text("title"),
  createdAt: createdAt(),
});

export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("password_resets_user_idx").on(t.userId)],
);

export const usersRelations = relations(users, ({ one }) => ({
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
    relationName: "userStudent",
  }),
  tutor: one(tutors, {
    fields: [users.id],
    references: [tutors.userId],
    relationName: "userTutor",
  }),
  admin: one(admins, {
    fields: [users.id],
    references: [admins.userId],
    relationName: "userAdmin",
  }),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
    relationName: "userStudent",
  }),
}));

export const tutorsRelations = relations(tutors, ({ one }) => ({
  user: one(users, {
    fields: [tutors.userId],
    references: [users.id],
    relationName: "userTutor",
  }),
}));

export const adminsRelations = relations(admins, ({ one }) => ({
  user: one(users, {
    fields: [admins.userId],
    references: [users.id],
    relationName: "userAdmin",
  }),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));
