import { z } from "zod";

export const submitAssignmentSchema = z.object({
  content: z.string().trim().max(10000).nullish(),
  fileUrl: z.string().trim().url("Enter a valid URL").nullish(),
  fileName: z.string().trim().max(255).nullish(),
});
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
