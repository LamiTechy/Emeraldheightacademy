import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { sendMessageSchema } from "@/lib/validators/comms";
import { requireApiUser } from "@/lib/auth/api-guard";
import { isSameOrigin } from "@/lib/security/csrf";
import { logAudit } from "@/lib/audit";
import { listInbox, listSent, listMessageTargets, getUnreadCount } from "@/lib/queries/comms";

const markReadSchema = z.object({ id: z.uuid() });

/** GET /api/messages?box=inbox|sent — lists + unread count + compose targets. */
export async function GET(request: Request) {
  const guard = await requireApiUser();
  if (guard.response) return guard.response;
  const user = guard.user;

  const url = new URL(request.url);
  const box = url.searchParams.get("box") === "sent" ? "sent" : "inbox";

  const [rows, unread, targets] = await Promise.all([
    box === "sent" ? listSent(user.id) : listInbox(user.id),
    getUnreadCount(user.id),
    listMessageTargets(user.id, user.role as "student" | "tutor" | "admin"),
  ]);
  return jsonOk({ messages: rows, unread, targets });
}

/** POST /api/messages — send a new message or reply within a thread. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiUser();
  if (guard.response) return guard.response;
  const user = guard.user;

  const parsed = await parseJsonBody(request, sendMessageSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }
  const d = parsed.data;

  if (d.recipientId === user.id) {
    return jsonError("You cannot message yourself", 422, {
      fieldErrors: { recipientId: ["Pick someone else"] },
    });
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, d.recipientId),
    columns: { id: true, status: true },
  });
  if (!target || target.status !== "active") {
    return jsonError("Recipient not found or inactive", 404);
  }

  if (d.parentId) {
    const parent = await db.query.messages.findFirst({ where: eq(messages.id, d.parentId) });
    if (!parent) return jsonError("Thread not found", 404);
    if (parent.senderId !== user.id && parent.recipientId !== user.id) {
      return jsonError("Not your conversation", 403);
    }
  }

  const [row] = await db
    .insert(messages)
    .values({
      senderId: user.id,
      recipientId: d.recipientId,
      parentId: d.parentId ?? null,
      subject: d.subject,
      body: d.body,
    })
    .returning({ id: messages.id });

  await logAudit({
    actorId: user.id,
    actorRole: user.role as "student" | "tutor" | "admin",
    action: "message.sent",
    entityType: "message",
    entityId: row!.id,
    summary: d.parentId ? "Replied to a message" : `Sent “${d.subject}”`,
  });

  return jsonOk({ id: row!.id });
}

/** PATCH /api/messages — mark a message as read. Body: { id } */
export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin", 403);
  const guard = await requireApiUser();
  if (guard.response) return guard.response;
  const user = guard.user;

  const parsed = await parseJsonBody(request, markReadSchema);
  if ("error" in parsed) {
    return jsonError(parsed.error, parsed.status, { fieldErrors: parsed.fieldErrors });
  }

  const existing = await db.query.messages.findFirst({
    where: eq(messages.id, parsed.data.id),
  });
  if (!existing) return jsonError("Message not found", 404);
  if (existing.recipientId !== user.id) return jsonError("Not your message", 403);

  if (!existing.readAt) {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(and(eq(messages.id, existing.id), isNull(messages.readAt)));
  }
  return jsonOk({ id: existing.id, read: true });
}
