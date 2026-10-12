import { z } from "zod";
import { educationLevelEnum } from "@/db/schema";

const phoneField = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number");

const optionalEmail = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(200)
  .optional()
  .or(z.literal(""));

// ── Public registration request ──────────────────────────────────────────────

export const publicRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(120),
  email: optionalEmail,
  phone: phoneField,
  courseIds: z.array(z.uuid()).max(6, "Pick up to 6 courses").default([]),
  preferredSchedule: z.string().trim().max(200).optional().or(z.literal("")),
  educationLevel: z.enum(educationLevelEnum.enumValues).optional(),
  guardianName: z.string().trim().max(120).optional().or(z.literal("")),
  guardianPhone: z.string().trim().max(30).optional().or(z.literal("")),
  guardianRelationship: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type PublicRegistrationInput = z.infer<typeof publicRegistrationSchema>;

// ── Public trial request ─────────────────────────────────────────────────────

export const publicTrialSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(120),
  phone: phoneField,
  email: optionalEmail,
  courseInterest: z.string().trim().min(2, "Tell us what you're interested in").max(200),
  preferredDate: z.iso.date().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type PublicTrialInput = z.infer<typeof publicTrialSchema>;

// ── Public contact message ───────────────────────────────────────────────────

export const publicContactSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Subject is too short").max(200),
  message: z.string().trim().min(5, "Message is too short").max(5000),
});
export type PublicContactInput = z.infer<typeof publicContactSchema>;
