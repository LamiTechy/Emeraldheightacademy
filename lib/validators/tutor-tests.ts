import { z } from "zod";
import {
  attemptStatusEnum,
  difficultyEnum,
  questionTypeEnum,
  testStatusEnum,
} from "@/db/schema";

// ── Questions (tutor question bank) ───────────────────────────────────────────

const questionBase = z.object({
  courseId: z.uuid("Select a course"),
  type: z.enum(questionTypeEnum.enumValues),
  difficulty: z.enum(difficultyEnum.enumValues).default("medium"),
  topic: z.string().trim().min(2).max(80),
  stem: z.string().trim().min(3, "Question text is too short").max(5000),
  options: z
    .array(z.object({ key: z.string().min(1).max(4), text: z.string().trim().min(1).max(500) }))
    .max(8)
    .default([]),
  correctKey: z.string().trim().max(4).nullish(),
  correctValue: z.boolean().nullish(),
  accepted: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  explanation: z.string().trim().max(2000).nullish(),
});

export const createQuestionSchema = questionBase
  .refine((d) => d.type !== "mcq" || d.options.length >= 2, {
    message: "MCQ needs at least 2 options",
    path: ["options"],
  })
  .refine(
    (d) => d.type !== "mcq" || (d.correctKey && d.options.some((o) => o.key === d.correctKey)),
    {
      message: "Pick the correct option",
      path: ["correctKey"],
    },
  )
  .refine((d) => d.type !== "true_false" || (d.correctValue !== undefined && d.correctValue !== null), {
    message: "Pick true or false",
    path: ["correctValue"],
  })
  .refine((d) => d.type !== "short_answer" || d.accepted.length > 0, {
    message: "Add at least one accepted answer",
    path: ["accepted"],
  });
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = questionBase.partial();
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

// ── Tests (tutor test builder) ────────────────────────────────────────────────

export const createTestSchema = z.object({
  courseId: z.uuid("Select a course"),
  batchId: z.uuid().nullish(),
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().max(2000).nullish(),
  durationMinutes: z.coerce.number().int().min(1).max(480).default(30),
  attemptsAllowed: z.coerce.number().int().min(1).max(10).default(1),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
  shuffleQuestions: z.coerce.boolean().default(true),
  shuffleOptions: z.coerce.boolean().default(true),
  showAnswersAfter: z.coerce.boolean().default(true),
  status: z.enum(testStatusEnum.enumValues).default("draft"),
});
export type CreateTestInput = z.infer<typeof createTestSchema>;

export const updateTestSchema = createTestSchema.partial();
export type UpdateTestInput = z.infer<typeof updateTestSchema>;

/** Replace the question list of a test (each with marks + order). */
export const setTestQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        questionId: z.uuid(),
        marks: z.coerce.number().min(0.5).max(100).default(1),
      }),
    )
    .max(100),
});
export type SetTestQuestionsInput = z.infer<typeof setTestQuestionsSchema>;

// ── Attempts (tutor grading) ──────────────────────────────────────────────────

export const gradeAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        answerId: z.uuid(),
        awardedMarks: z.coerce.number().min(0),
        feedback: z.string().trim().max(1000).nullish(),
      }),
    )
    .min(1),
  finalize: z.coerce.boolean().default(true),
});
export type GradeAttemptInput = z.infer<typeof gradeAttemptSchema>;

// ── Attempts (student) ────────────────────────────────────────────────────────

export const saveAnswerSchema = z.object({
  questionId: z.uuid(),
  key: z.string().trim().max(4).nullish(),
  value: z.boolean().nullish(),
  text: z.string().trim().max(5000).nullish(),
});
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;

export type AttemptStatusValue = (typeof attemptStatusEnum.enumValues)[number];
