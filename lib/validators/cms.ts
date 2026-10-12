import { z } from "zod";
import { eventStatusEnum } from "@/db/schema";
import { slugify } from "@/lib/format";

/**
 * Image URLs: root-relative site assets (`/images/…`) or absolute http(s).
 * Protocol-relative (`//…`) is rejected.
 */
const imageUrlString = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//.test(v),
    "Enter a valid image URL",
  );

// ── News ─────────────────────────────────────────────────────────────────────

export const createNewsSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? slugify(v) : undefined)),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Body is too short").max(50000),
  coverImageUrl: imageUrlString.optional().or(z.literal("")),
  published: z.boolean().default(false),
});
export type CreateNewsInput = z.infer<typeof createNewsSchema>;

export const updateNewsSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  body: z.string().trim().min(10).max(50000).optional(),
  coverImageUrl: imageUrlString.optional().or(z.literal("")),
  published: z.boolean().optional(),
});
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;

// ── Events ───────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? slugify(v) : undefined)),
  description: z.string().trim().min(5, "Description is too short").max(10000),
  coverImageUrl: imageUrlString.optional().or(z.literal("")),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  status: z.enum(eventStatusEnum.enumValues).default("upcoming"),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(5).max(10000).optional(),
  coverImageUrl: imageUrlString.optional().or(z.literal("")),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  status: z.enum(eventStatusEnum.enumValues).optional(),
});
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// ── Gallery ──────────────────────────────────────────────────────────────────

export const createGalleryItemSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(200),
  caption: z.string().trim().max(500).optional().or(z.literal("")),
  imageUrl: imageUrlString,
  category: z.string().trim().max(80).default("general"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});
export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;

export const updateGalleryItemSchema = createGalleryItemSchema.partial();
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>;

// ── Testimonials ─────────────────────────────────────────────────────────────

export const createTestimonialSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  program: z.string().trim().max(200).optional().or(z.literal("")),
  quote: z.string().trim().min(5, "Quote is too short").max(2000),
  photoUrl: imageUrlString.optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5).optional(),
  featured: z.boolean().default(false),
  approved: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

export const updateTestimonialSchema = createTestimonialSchema.partial();
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;

// ── FAQs ─────────────────────────────────────────────────────────────────────

export const createFaqSchema = z.object({
  question: z.string().trim().min(3, "Question is too short").max(300),
  answer: z.string().trim().min(3, "Answer is too short").max(5000),
  category: z.string().trim().max(80).default("General"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});
export type CreateFaqInput = z.infer<typeof createFaqSchema>;

export const updateFaqSchema = createFaqSchema.partial();
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;

// ── Fees info setting ────────────────────────────────────────────────────────

export const updateFeesInfoSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(10).max(10000),
});
export type UpdateFeesInfoInput = z.infer<typeof updateFeesInfoSchema>;
