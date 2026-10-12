"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { ArrowLeftIcon, MailIcon, SendIcon } from "lucide-react";

export type MessageRow = {
  id: string;
  subject: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  senderId: string;
  recipientId: string;
  parentId: string | null;
  senderName: string;
  senderRole: string;
  recipientName: string;
  recipientRole: string;
};

export type ComposeTarget = { id: string; name: string; role: string };

function ComposeDialog({
  open,
  onOpenChange,
  targets,
  replyTo,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targets: ComposeTarget[];
  replyTo?: MessageRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [recipientId, setRecipientId] = React.useState(replyTo?.senderId ?? "");
  const [subject, setSubject] = React.useState(replyTo ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = React.useState("");

  async function send() {
    if (!replyTo && !recipientId) {
      toast.error("Pick a recipient");
      return;
    }
    if (!body.trim()) {
      toast.error("Write a message");
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest("/api/messages", {
        method: "POST",
        body: {
          recipientId: replyTo ? replyTo.senderId : recipientId,
          subject: subject.trim() || "Message",
          body: body.trim(),
          parentId: replyTo?.id ?? null,
        },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed to send");
        return;
      }
      toast.success("Message sent");
      onOpenChange(false);
      setBody("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{replyTo ? "Reply" : "New message"}</DialogTitle>
          <DialogDescription>
            {replyTo ? `To ${replyTo.senderName}` : "Send a message to staff or students."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!replyTo ? (
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a recipient" />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="msg-subject">Subject</Label>
            <Input
              id="msg-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!!replyTo}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea
              id="msg-body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={send} disabled={busy}>
            <SendIcon /> {busy ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThreadView({
  thread,
  onBack,
  currentUserId,
}: {
  thread: MessageRow[];
  onBack: () => void;
  currentUserId: string;
}) {
  const router = useRouter();
  const root = thread[0];
  const [replyOpen, setReplyOpen] = React.useState(false);

  React.useEffect(() => {
    if (!root) return;
    if (root.recipientId === currentUserId && !root.readAt) {
      void apiRequest("/api/messages", { method: "PATCH", body: { id: root.id } }).then(() => {
        router.refresh();
      });
    }
  }, [root, currentUserId, router]);

  if (!root) return null;
  const counterpart =
    root.senderId === currentUserId ? root.recipientName : root.senderName;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onBack}>
            <ArrowLeftIcon />
          </Button>
          <div>
            <CardTitle className="text-base">{root.subject}</CardTitle>
            <CardDescription>Conversation with {counterpart}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {thread.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl border p-3 text-sm ${
                  mine ? "bg-primary/5" : "bg-card"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{m.senderName}</span>
                  <StatusBadge status={m.senderRole} />
                  <span>{formatDateTime(m.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={() => setReplyOpen(true)}>
            <SendIcon /> Reply
          </Button>
        </div>
      </CardContent>
      {replyOpen ? (
        <ComposeDialog
          open
          onOpenChange={setReplyOpen}
          targets={[]}
          replyTo={root}
        />
      ) : null}
    </Card>
  );
}

export function MessagesClient({
  inbox,
  sent,
  targets,
  currentUserId,
  initialBox,
}: {
  inbox: MessageRow[];
  sent: MessageRow[];
  targets: ComposeTarget[];
  currentUserId: string;
  initialBox: "inbox" | "sent";
}) {
  const [box, setBox] = React.useState<"inbox" | "sent">(initialBox);
  const [thread, setThread] = React.useState<MessageRow[] | null>(null);
  const [loadingThread, setLoadingThread] = React.useState(false);
  const [composeOpen, setComposeOpen] = React.useState(false);

  const rows = box === "inbox" ? inbox : sent;
  const unread = inbox.filter((m) => !m.readAt).length;

  async function openThread(id: string) {
    setLoadingThread(true);
    try {
      const result = await apiRequest<{ thread: MessageRow[] }>(`/api/messages/${id}`);
      if (!result.ok || !result.data) {
        toast.error(result.error ?? "Could not open conversation");
        return;
      }
      setThread(result.data.thread);
    } finally {
      setLoadingThread(false);
    }
  }

  if (thread) {
    return <ThreadView thread={thread} onBack={() => setThread(null)} currentUserId={currentUserId} />;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Button
            size="sm"
            variant={box === "inbox" ? "secondary" : "ghost"}
            onClick={() => setBox("inbox")}
          >
            <MailIcon /> Inbox {unread > 0 ? `(${unread})` : ""}
          </Button>
          <Button
            size="sm"
            variant={box === "sent" ? "secondary" : "ghost"}
            onClick={() => setBox("sent")}
          >
            Sent
          </Button>
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setComposeOpen(true)}>
          <SendIcon /> Compose
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={box === "inbox" ? "Inbox is empty" : "No sent messages"}
          description={
            box === "inbox"
              ? "Messages from tutors, students or the office will appear here."
              : "Messages you send will show up here."
          }
        />
      ) : (
        <div className="space-y-2">
          {rows.map((m) => {
            const other = box === "inbox" ? m.senderName : m.recipientName;
            const otherRole = box === "inbox" ? m.senderRole : m.recipientRole;
            const isUnread = box === "inbox" && !m.readAt;
            return (
              <button
                key={m.id}
                onClick={() => void openThread(m.id)}
                disabled={loadingThread}
                className="flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 disabled:opacity-60"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isUnread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {other
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
                      {other}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                  <p className={`truncate text-sm ${isUnread ? "font-medium" : "text-muted-foreground"}`}>
                    {m.subject}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{m.body}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {otherRole}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {composeOpen ? (
        <ComposeDialog open onOpenChange={setComposeOpen} targets={targets} />
      ) : null}
    </>
  );
}
