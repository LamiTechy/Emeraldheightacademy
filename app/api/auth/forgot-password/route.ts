import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { isSameOrigin } from "@/lib/security/csrf";
import { sendEmailInBackground } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { siteConfig } from "@/lib/site";

const RESET_TTL_MINUTES = 60;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const ip = clientIp(request);
  const limited = rateLimit({ key: `forgot:${ip}`, ...RATE_LIMITS.forgotPassword });
  if (!limited.ok) {
    return jsonError("Too many requests. Try again later.", 429, {
      retryAfter: limited.retryAfterSeconds,
    });
  }

  const parsed = await parseJsonBody(request, forgotPasswordSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  if (parsed.data.honeypot) {
    return jsonOk({ message: "If that email is registered, a reset link has been sent." });
  }

  const { email } = parsed.data;
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), isNull(users.deletedAt)),
  });

  if (user && user.status === "active") {
    const token = randomBytes(32).toString("base64url");
    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
    });

    const resetUrl = `${siteConfig.url}/reset-password?token=${encodeURIComponent(token)}`;
    const emailContent = passwordResetEmail({
      name: user.name,
      resetUrl,
      expiresInMinutes: RESET_TTL_MINUTES,
    });
    sendEmailInBackground({ to: user.email, ...emailContent });

    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.password_reset_requested",
      entityType: "user",
      entityId: user.id,
      summary: `Password reset requested for ${user.email}`,
    });
  }

  // Same response whether or not the email exists (no account enumeration).
  return jsonOk({
    message: "If that email is registered, a reset link has been sent.",
  });
}
