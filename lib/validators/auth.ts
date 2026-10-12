import { z } from "zod";
import { passwordStrengthSchema } from "@/lib/auth/passwords";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

/** Honeypot field — real users never fill it. */
export const honeypotField = z.literal("").optional();

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password").max(128),
  honeypot: honeypotField,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
  honeypot: honeypotField,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Invalid reset link"),
    password: passwordStrengthSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordStrengthSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
