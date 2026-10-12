import { sql } from "drizzle-orm";
import { dbTx } from "@/db";
import { admins, students, tutors, users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody, isUniqueViolation } from "@/lib/api";
import { createUserSchema } from "@/lib/validators/admin";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/passwords";
import { pad } from "@/lib/format";

/** Create a student / tutor / admin account (with the matching profile row). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createUserSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const data = parsed.data;

  const passwordHash = await hashPassword(data.password);

  try {
    const id = await dbTx.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          role: data.role,
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          passwordHash,
          status: data.status,
          mustChangePassword: true,
        })
        .returning({ id: users.id });
      const userId = user!.id;

      if (data.role === "student") {
        const [{ count }] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(students);
        await tx.insert(students).values({
          userId,
          studentId: `STU-${new Date().getFullYear()}-${pad((count ?? 0) + 1, 4)}`,
          educationLevel: data.educationLevel ?? null,
          gender: data.gender ?? null,
          school: data.school ?? null,
          guardianName: data.guardianName ?? null,
          guardianPhone: data.guardianPhone ?? null,
        });
      } else if (data.role === "tutor") {
        const [{ count }] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(tutors);
        await tx.insert(tutors).values({
          userId,
          tutorId: `TUT-${pad((count ?? 0) + 1, 3)}`,
          bio: data.bio ?? null,
          qualifications: data.qualifications ?? null,
        });
      } else {
        await tx.insert(admins).values({ userId });
      }

      return userId;
    });

    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: "admin.user_created",
      entityType: "user",
      entityId: id,
      summary: `Created ${data.role} account for ${data.name}`,
      metadata: { email: data.email },
    });

    return jsonOk({ id });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A user with that email or phone already exists", 409, {
        fieldErrors: { email: ["Email already in use"] },
      });
    }
    throw error;
  }
}
