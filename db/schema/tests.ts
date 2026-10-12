import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./helpers";
import { attemptStatusEnum, difficultyEnum, questionTypeEnum, testStatusEnum } from "./enums";
import { batches, courses } from "./academics";
import { students, tutors, users } from "./users";

export type QuestionOption = { key: string; text: string };
export type CorrectAnswer = { key?: string; value?: boolean; accepted?: string[] };
export type AnswerValue = { key?: string; value?: boolean; text?: string };

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    tutorId: uuid("tutor_id").references(() => tutors.id, { onDelete: "set null" }),
    type: questionTypeEnum("type").notNull(),
    difficulty: difficultyEnum("difficulty").notNull().default("medium"),
    topic: text("topic").notNull(),
    stem: text("stem").notNull(),
    options: jsonb("options").$type<QuestionOption[]>().notNull().default([]),
    correctAnswer: jsonb("correct_answer").$type<CorrectAnswer>().notNull(),
    explanation: text("explanation"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("questions_course_topic_idx").on(t.courseId, t.topic)],
);

export const tests = pgTable(
  "tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id").references(() => batches.id, { onDelete: "set null" }),
    tutorId: uuid("tutor_id")
      .notNull()
      .references(() => tutors.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    attemptsAllowed: integer("attempts_allowed").notNull().default(1),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    shuffleQuestions: boolean("shuffle_questions").notNull().default(true),
    shuffleOptions: boolean("shuffle_options").notNull().default(true),
    showAnswersAfter: boolean("show_answers_after").notNull().default(true),
    status: testStatusEnum("status").notNull().default("draft"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("tests_course_status_idx").on(t.courseId, t.status), index("tests_batch_idx").on(t.batchId)],
);

export const testQuestions = pgTable(
  "test_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(0),
    marks: numeric("marks", { precision: 5, scale: 2 }).notNull().default("1"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("test_questions_test_question_key").on(t.testId, t.questionId),
    index("test_questions_test_idx").on(t.testId),
  ],
);

export const testAttempts = pgTable(
  "test_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: attemptStatusEnum("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    autoSubmitted: boolean("auto_submitted").notNull().default(false),
    totalScore: numeric("total_score", { precision: 7, scale: 2 }),
    maxScore: numeric("max_score", { precision: 7, scale: 2 }),
    tabSwitchCount: integer("tab_switch_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("test_attempts_test_student_number_key").on(t.testId, t.studentId, t.attemptNumber),
    uniqueIndex("test_attempts_one_active_key")
      .on(t.testId, t.studentId)
      .where(sql`${t.status} = 'in_progress'`),
    index("test_attempts_student_idx").on(t.studentId),
  ],
);

export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => testAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    answer: jsonb("answer").$type<AnswerValue>(),
    isCorrect: boolean("is_correct"),
    awardedMarks: numeric("awarded_marks", { precision: 7, scale: 2 }).notNull().default("0"),
    feedback: text("feedback"),
    gradedBy: uuid("graded_by").references(() => users.id, { onDelete: "set null" }),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("attempt_answers_attempt_question_key").on(t.attemptId, t.questionId),
    index("attempt_answers_question_idx").on(t.questionId),
  ],
);

export const questionsRelations = relations(questions, ({ one }) => ({
  course: one(courses, {
    fields: [questions.courseId],
    references: [courses.id],
  }),
  tutor: one(tutors, {
    fields: [questions.tutorId],
    references: [tutors.id],
  }),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  course: one(courses, {
    fields: [tests.courseId],
    references: [courses.id],
  }),
  batch: one(batches, {
    fields: [tests.batchId],
    references: [batches.id],
  }),
  tutor: one(tutors, {
    fields: [tests.tutorId],
    references: [tutors.id],
  }),
  testQuestions: many(testQuestions),
  attempts: many(testAttempts),
}));

export const testQuestionsRelations = relations(testQuestions, ({ one }) => ({
  test: one(tests, {
    fields: [testQuestions.testId],
    references: [tests.id],
  }),
  question: one(questions, {
    fields: [testQuestions.questionId],
    references: [questions.id],
  }),
}));

export const testAttemptsRelations = relations(testAttempts, ({ one, many }) => ({
  test: one(tests, {
    fields: [testAttempts.testId],
    references: [tests.id],
  }),
  student: one(students, {
    fields: [testAttempts.studentId],
    references: [students.id],
  }),
  answers: many(attemptAnswers),
}));

export const attemptAnswersRelations = relations(attemptAnswers, ({ one }) => ({
  attempt: one(testAttempts, {
    fields: [attemptAnswers.attemptId],
    references: [testAttempts.id],
  }),
  question: one(questions, {
    fields: [attemptAnswers.questionId],
    references: [questions.id],
  }),
  gradedByUser: one(users, {
    fields: [attemptAnswers.gradedBy],
    references: [users.id],
  }),
}));
