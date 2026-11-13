"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackReportShared } from "@/lib/analytics";

export function ShareButton({ reportId }: { reportId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    trackReportShared({ reportId });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick}>
      {copied ? "Link copied!" : "Copy link"}
    </Button>
  );
}
