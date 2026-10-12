import { getSetting } from "@/lib/settings";
import { siteConfig } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

export const metadata = { title: "Fees & How to Pay" };

/** Fees copy is CMS-managed — render on demand. */
export const instant = false;

type FeesInfo = { title?: string; body?: string; lastUpdated?: string | null };

export default async function FeesPage() {
  const fees = await getSetting<FeesInfo | null>("fees_info", null);
  const title = fees?.title ?? "Fees & How to Pay";
  const body =
    fees?.body ??
    `Fees at ${siteConfig.name} are paid offline — there is no online payment on this website. Call or WhatsApp the office for the current fee schedule.`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <Badge variant="secondary">No online payment</Badge>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground">
          Fees are settled offline at the centre — this site never asks for card or bank details.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {body}
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        For the current fee schedule for any course, call {siteConfig.phone} or visit us at{" "}
        {siteConfig.address}.
      </p>
    </div>
  );
}
