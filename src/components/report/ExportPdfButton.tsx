"use client";

import { Button } from "@/components/ui/Button";
import { trackPdfExported } from "@/lib/analytics";

export function ExportPdfButton({ reportId }: { reportId: string }) {
  function handleClick() {
    trackPdfExported({ reportId });
    window.print();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleClick}>
      Export PDF
    </Button>
  );
}
