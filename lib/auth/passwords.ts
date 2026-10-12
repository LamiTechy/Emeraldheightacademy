import bcrypt from "bcryptjs";
import { z } from "zod";

const COST = 12;

/** Valid-format hash used to equalise response timing when an email is unknown. */
export const DUMMY_HASH = "$2b$12$lUukokQmW/szVqemRhIyseGsWM4YoE9jnOvKaUf.OXGH3rKtZYgfi";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export const passwordStrengthSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine((value) => /[a-z]/.test(value), "Include a lowercase letter")
  .refine((value) => /[A-Z]/.test(value), "Include an uppercase letter")
  .refine((value) => /[0-9]/.test(value), "Include a number");
