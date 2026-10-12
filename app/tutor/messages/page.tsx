export const instant = false;

import { PageHeader } from "@/components/layout/page-header";
import { MessagesClient } from "@/components/shared/messages-client";
import { requireUser } from "@/lib/auth/session";
import { listInbox, listSent, listMessageTargets } from "@/lib/queries/comms";

export default async function TutorMessagesPage() {
  const user = await requireUser("tutor");

  const [inbox, sent, targets] = await Promise.all([
    listInbox(user.id),
    listSent(user.id),
    listMessageTargets(user.id, "tutor"),
  ]);

  return (
    <>
      <PageHeader title="Messages" description="Conversations with students and the office." />
      <MessagesClient
        inbox={inbox}
        sent={sent}
        targets={targets}
        currentUserId={user.id}
        initialBox="inbox"
      />
    </>
  );
}
