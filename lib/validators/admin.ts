import { z } from "zod";
import {
  batchStatusEnum,
  courseCategoryEnum,
  courseModeEnum,
  courseStatusEnum,
  educationLevelEnum,
  enrollmentStatusEnum,
  genderEnum,
  userRoleEnum,
  userStatusEnum,
} from "@/db/schema";
import { passwordStrengthSchema } from "@/lib/auth/passwords";
import { emailField } from "@/lib/validators/auth";

const timeField = z.string().regex(/^\d{1,2}:\d{2}(:\d{2})?$/, "Use a time like 16:00");

const phoneField = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number");

const optionalPhone = phoneField.optional().nullish();

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullish();

// ── Users ─────────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  role: z.enum(userRoleEnum.enumValues),
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: emailField,
  phone: optionalPhone,
  password: passwordStrengthSchema,
  status: z.enum(userStatusEnum.enumValues).default("active"),
  // student profile (optional)
  educationLevel: z.enum(educationLevelEnum.enumValues).optional(),
  gender: z.enum(genderEnum.enumValues).optional(),
  school: optionalText(160),
  guardianName: optionalText(120),
  guardianPhone: optionalPhone,
  // tutor profile (optional)
  bio: z.string().trim().max(2000).optional().nullish(),
  qualifications: optionalText(500),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: emailField.optional(),
  phone: optionalPhone,
  status: z.enum(userStatusEnum.enumValues).optional(),
  mustChangePassword: z.boolean().optional(),
  educationLevel: z.enum(educationLevelEnum.enumValues).optional(),
  gender: z.enum(genderEnum.enumValues).optional(),
  school: optionalText(160),
  guardianName: optionalText(120),
  guardianPhone: optionalPhone,
  bio: z.string().trim().max(2000).optional().nullish(),
  qualifications: optionalText(500),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const setUserPasswordSchema = z.object({
  password: passwordStrengthSchema,
});

// ── Courses ───────────────────────────────────────────────────────────────────

export const createCourseSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(3).max(100),
  category: z.enum(courseCategoryEnum.enumValues).default("other"),
  description: z.string().trim().min(10, "Write at least a short description").max(600),
  longDescription: optionalText(4000),
  durationWeeks: z.coerce.number().int().min(1).max(104).optional(),
  scheduleSummary: optionalText(300),
  mode: z.enum(courseModeEnum.enumValues).default("hybrid"),
  status: z.enum(courseStatusEnum.enumValues).default("active"),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.partial();
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// ── Batches ───────────────────────────────────────────────────────────────────

const batchBase = z.object({
  courseId: z.uuid("Select a course"),
  name: z.string().trim().min(3).max(100),
  code: z.string().trim().min(2).max(20),
  daysOfWeek: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, "Pick at least one day"),
  startTime: timeField,
  endTime: timeField,
  mode: z.enum(courseModeEnum.enumValues).default("physical"),
  room: optionalText(80),
  capacity: z.coerce.number().int().min(1).max(500).default(30),
  startDate: z.iso.date("Pick a start date"),
  endDate: z.iso.date("Pick an end date"),
  status: z.enum(batchStatusEnum.enumValues).default("upcoming"),
  tutorIds: z.array(z.uuid()).default([]),
});

export const createBatchSchema = batchBase.refine((d) => d.startTime !== d.endTime, {
  message: "Start and end times must differ",
  path: ["endTime"],
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const updateBatchSchema = batchBase
  .partial()
  .refine(
    (d) =>
      d.startTime === undefined || d.endTime === undefined || d.startTime !== d.endTime,
    {
      message: "Start and end times must differ",
      path: ["endTime"],
    },
  );
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

// ── Enrollments ───────────────────────────────────────────────────────────────

export const createEnrollmentSchema = z.object({
  studentUserId: z.uuid("Select a student"),
  batchId: z.uuid("Select a batch"),
  notes: optionalText(500),
});
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentSchema = z.object({
  status: z.enum(enrollmentStatusEnum.enumValues),
  notes: z.string().trim().max(500).optional().nullish(),
});
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;

// ── Timetable slots ───────────────────────────────────────────────────────────

const slotBase = z.object({
  batchId: z.uuid("Select a batch"),
  tutorId: z.uuid("Select a tutor"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: timeField,
  endTime: timeField,
  room: optionalText(80),
  validFrom: z.iso.date().nullish(),
  validTo: z.iso.date().nullish(),
});

export const createSlotSchema = slotBase.refine((d) => d.startTime !== d.endTime, {
  message: "Start and end times must differ",
  path: ["endTime"],
});
export type CreateSlotInput = z.infer<typeof createSlotSchema>;

export const updateSlotSchema = slotBase
  .partial()
  .refine(
    (d) =>
      d.startTime === undefined || d.endTime === undefined || d.startTime !== d.endTime,
    {
      message: "Start and end times must differ",
      path: ["endTime"],
    },
  );
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
