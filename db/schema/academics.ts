import { relations } from "drizzle-orm";
import { boolean, date, index, integer, pgTable, text, time, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./helpers";
import {
  batchStatusEnum,
  courseCategoryEnum,
  courseModeEnum,
  courseStatusEnum,
  enrollmentStatusEnum,
} from "./enums";
import { students, tutors } from "./users";

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    category: courseCategoryEnum("category").notNull().default("other"),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    durationWeeks: integer("duration_weeks"),
    scheduleSummary: text("schedule_summary"),
    mode: courseModeEnum("mode").notNull().default("hybrid"),
    syllabus: text("syllabus").array(),
    imageUrl: text("image_url"),
    status: courseStatusEnum("status").notNull().default("active"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("courses_status_idx").on(t.status), index("courses_category_idx").on(t.category)],
);

export const batches = pgTable(
  "batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    daysOfWeek: integer("days_of_week").array().notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    mode: courseModeEnum("mode").notNull().default("physical"),
    room: text("room"),
    meetingUrl: text("meeting_url"),
    capacity: integer("capacity").notNull().default(30),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: batchStatusEnum("status").notNull().default("upcoming"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("batches_course_idx").on(t.courseId), index("batches_status_idx").on(t.status)],
);

export const tutorAssignments = pgTable(
  "tutor_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutorId: uuid("tutor_id")
      .notNull()
      .references(() => tutors.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("lead"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("tutor_assignments_tutor_batch_key").on(t.tutorId, t.batchId),
    index("tutor_assignments_batch_idx").on(t.batchId),
  ],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    droppedAt: timestamp("dropped_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("enrollments_student_batch_key").on(t.studentId, t.batchId),
    index("enrollments_batch_status_idx").on(t.batchId, t.status),
  ],
);

export const timetableSlots = pgTable(
  "timetable_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    tutorId: uuid("tutor_id")
      .notNull()
      .references(() => tutors.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    room: text("room"),
    meetingUrl: text("meeting_url"),
    validFrom: date("valid_from"),
    validTo: date("valid_to"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("timetable_slots_tutor_day_idx").on(t.tutorId, t.dayOfWeek),
    index("timetable_slots_batch_day_idx").on(t.batchId, t.dayOfWeek),
  ],
);

export const coursesRelations = relations(courses, ({ many }) => ({
  batches: many(batches),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  course: one(courses, {
    fields: [batches.courseId],
    references: [courses.id],
  }),
  tutorAssignments: many(tutorAssignments),
  enrollments: many(enrollments),
  timetableSlots: many(timetableSlots),
}));

export const tutorAssignmentsRelations = relations(tutorAssignments, ({ one }) => ({
  tutor: one(tutors, {
    fields: [tutorAssignments.tutorId],
    references: [tutors.id],
  }),
  batch: one(batches, {
    fields: [tutorAssignments.batchId],
    references: [batches.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  batch: one(batches, {
    fields: [enrollments.batchId],
    references: [batches.id],
  }),
}));

export const timetableSlotsRelations = relations(timetableSlots, ({ one }) => ({
  batch: one(batches, {
    fields: [timetableSlots.batchId],
    references: [batches.id],
  }),
  tutor: one(tutors, {
    fields: [timetableSlots.tutorId],
    references: [tutors.id],
  }),
}));
