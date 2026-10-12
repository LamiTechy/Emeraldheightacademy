export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { UsersClient } from "@/components/admin/users-client";
import type { UserView } from "@/components/admin/types";
import { listUsers } from "@/lib/queries/admin";
import { userRoleEnum, userStatusEnum } from "@/db/schema";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;

  const role = userRoleEnum.enumValues.find((r) => r === sp.role);
  const status = userStatusEnum.enumValues.find((s) => s === sp.status);
  const q = sp.q?.slice(0, 60);

  const rows = await listUsers({ role, status, q });

  const views: UserView[] = rows.map((r) => ({
    id: r.id,
    role: r.role,
    name: r.name,
    email: r.email,
    phone: r.phone,
    status: r.status,
    mustChangePassword: r.mustChangePassword,
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
    createdAt: r.createdAt?.toISOString() ?? null,
    studentId: r.student?.studentId ?? null,
    educationLevel: r.student?.educationLevel ?? null,
    gender: r.student?.gender ?? null,
    school: r.student?.school ?? null,
    guardianName: r.student?.guardianName ?? null,
    guardianPhone: r.student?.guardianPhone ?? null,
    tutorId: r.tutor?.tutorId ?? null,
    bio: r.tutor?.bio ?? null,
    qualifications: r.tutor?.qualifications ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Users"
        description="Student, tutor and admin accounts for the whole centre."
      />
      <UsersClient rows={views} />
    </>
  );
}
