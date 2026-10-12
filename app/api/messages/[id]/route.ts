import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getMessageThread } from "@/lib/queries/comms";

type Params = { params: Promise<{ id: string }> };

const paramsSchema = z.object({ id: z.uuid() });

/** GET /api/messages/[id] — full thread (root + replies) for participants. */
export async function GET(_request: Request, { params }: Params) {
  const guard = await requireApiUser();
  if (guard.response) return guard.response;
  const user = guard.user;

  const { id } = await params;
  const parsed = paramsSchema.safeParse({ id });
  if (!parsed.success) return jsonError("Invalid message id", 422);

  const thread = await getMessageThread(parsed.data.id, user.id);
  if (!thread) return jsonError("Thread not found", 404);

  return jsonOk({ thread });
}
