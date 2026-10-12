"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import { SaveIcon } from "lucide-react";

type FeesInfo = { title: string; body: string; lastUpdated: string | null };

export function FeesEditor({ initial }: { initial: FeesInfo }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState(initial.title);
  const [body, setBody] = React.useState(initial.body);

  async function save() {
    if (!title.trim() || body.trim().length < 10) {
      toast.error("Title and body are required");
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest("/api/admin/cms/fees", {
        method: "PATCH",
        body: { title: title.trim(), body: body.trim() },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Failed");
        return;
      }
      toast.success("Fees page updated");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fees & How to Pay</CardTitle>
        <CardDescription>
          This text is shown on the public /fees page. There is never an online payment flow.
          {initial.lastUpdated ? ` Last updated ${new Date(initial.lastUpdated).toLocaleString("en-GB")}.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fees-title">Page title</Label>
          <Input id="fees-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fees-body">Body</Label>
          <Textarea id="fees-body" rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <Button size="sm" onClick={save} disabled={busy}>
          <SaveIcon /> {busy ? "Saving…" : "Save fees page"}
        </Button>
      </CardContent>
    </Card>
  );
}
