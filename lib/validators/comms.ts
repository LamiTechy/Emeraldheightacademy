import { z } from "zod";
import { announcementScopeEnum, userRoleEnum } from "@/db/schema";

// ── Announcements ────────────────────────────────────────────────────────────

export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short").max(200),
    body: z.string().trim().min(3, "Body is too short").max(10000),
    scope: z.enum(announcementScopeEnum.enumValues).default("global"),
    audienceRole: z.enum(userRoleEnum.enumValues).nullish(),
    courseId: z.uuid().nullish(),
    batchId: z.uuid().nullish(),
    pinned: z.boolean().default(false),
    publishAt: z.coerce.date().nullish(),
  })
  .refine((d) => d.scope !== "role" || !!d.audienceRole, {
    message: "Pick who should see this",
    path: ["audienceRole"],
  })
  .refine((d) => d.scope !== "course" || !!d.courseId, {
    message: "Pick a course",
    path: ["courseId"],
  })
  .refine((d) => d.scope !== "batch" || !!d.batchId, {
    message: "Pick a batch",
    path: ["batchId"],
  });
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  body: z.string().trim().min(3).max(10000).optional(),
  pinned: z.boolean().optional(),
  publishAt: z.coerce.date().nullish(),
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// ── Messages ─────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  recipientId: z.uuid("Pick a recipient"),
  subject: z.string().trim().min(2, "Subject is too short").max(200),
  body: z.string().trim().min(2, "Message is too short").max(10000),
  parentId: z.uuid().nullish(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
