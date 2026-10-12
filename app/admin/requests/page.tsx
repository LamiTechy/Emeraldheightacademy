export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/session";
import { RequestsClient } from "@/components/admin/requests-client";
import { db } from "@/db";
import { contactMessages, registrationRequests } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function RequestsPage() {
  await requireUser("admin");

  const [registrations, contacts] = await Promise.all([
    db.select().from(registrationRequests).orderBy(desc(registrationRequests.createdAt)),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
  ]);

  return (
    <>
      <PageHeader
        title="Public Requests"
        description="Registration and contact submissions from the public website."
      />
      <RequestsClient
        registrations={registrations.map((r) => ({
          id: r.id,
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          courseIds: r.courseIds,
          preferredSchedule: r.preferredSchedule,
          message: r.message,
          status: r.status,
          rejectionReason: r.rejectionReason,
          createdAt: r.createdAt,
        }))}
        contacts={contacts.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          subject: c.subject,
          message: c.message,
          status: c.status,
          createdAt: c.createdAt,
        }))}
      />
    </>
  );
}
