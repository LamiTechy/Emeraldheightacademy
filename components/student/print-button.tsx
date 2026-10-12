"use client";

import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <PrinterIcon /> Print / Save as PDF
    </Button>
  );
}
