import { z } from "zod";
import {
  attendanceStatusEnum,
  assignmentStatusEnum,
  materialTypeEnum,
} from "@/db/schema";

// ── Attendance ────────────────────────────────────────────────────────────────

export const markAttendanceSchema = z.object({
  batchId: z.uuid("Select a batch"),
  day: z.iso.date("Pick a date"),
  slotId: z.uuid().nullish(),
  entries: z
    .array(
      z.object({
        studentId: z.uuid(),
        status: z.enum(attendanceStatusEnum.enumValues),
        notes: z.string().trim().max(500).nullish(),
      }),
    )
    .min(1, "Nothing to save")
    .max(200),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

// ── Assignments ───────────────────────────────────────────────────────────────

export const createAssignmentSchema = z.object({
  batchId: z.uuid("Select a batch"),
  title: z.string().trim().min(3, "Title is too short").max(120),
  instructions: z.string().trim().min(3, "Add the assignment instructions").max(5000),
  dueAt: z.coerce.date({ error: "Pick a valid due date" }),
  points: z.coerce.number().int().min(1).max(1000).default(100),
  attachmentUrl: z.string().trim().url("Enter a valid URL").nullish(),
  attachmentName: z.string().trim().max(120).nullish(),
  status: z.enum(assignmentStatusEnum.enumValues).default("published"),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = createAssignmentSchema.partial();
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

export const gradeSubmissionSchema = z.object({
  score: z.coerce.number().min(0, "Score cannot be negative"),
  feedback: z.string().trim().max(2000).nullish(),
  action: z.enum(["grade", "return"]).default("grade"),
});
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;

// ── Materials ─────────────────────────────────────────────────────────────────

export const createMaterialSchema = z.object({
  courseId: z.uuid("Select a course"),
  batchId: z.uuid().nullish(),
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().max(2000).nullish(),
  type: z.enum(materialTypeEnum.enumValues).default("note"),
  url: z.string().trim().url("Enter a valid URL"),
  fileName: z.string().trim().max(255).nullish(),
  fileSize: z.coerce.number().int().min(0).max(50_000_000).nullish(),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).default([]),
});
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

export const updateMaterialSchema = createMaterialSchema.partial();
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
