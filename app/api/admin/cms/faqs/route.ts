import { asc } from "drizzle-orm";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { createFaqSchema } from "@/lib/validators/cms";
import { requireApiRole } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";

/** List all FAQs for the CMS. */
export async function GET() {
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;

  const rows = await db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.createdAt));
  return jsonOk({ faqs: rows });
}

/** Create an FAQ. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiRole("admin");
  if (guard.response) return guard.response;
  const admin = guard.user;

  const parsed = await parseJsonBody(request, createFaqSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  const [row] = await db
    .insert(faqs)
    .values({
      question: d.question,
      answer: d.answer,
      category: d.category,
      sortOrder: d.sortOrder,
      active: d.active,
    })
    .returning({ id: faqs.id });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "cms.faq_created",
    entityType: "faq",
    entityId: row!.id,
    summary: `Added FAQ “${d.question}”`,
  });

  return jsonOk({ id: row!.id });
}
