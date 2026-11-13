"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { PrdContent } from "@/lib/types";

export function PrdPanel({
  prd,
  onRegenerate,
  loading,
}: {
  prd: PrdContent;
  onRegenerate: () => void;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prd.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([prd.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prd.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-5 print:border-0 print:shadow-none">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted">
          Generated {new Date(prd.generatedAt).toLocaleString()} · {prd.model}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            Download .md
          </Button>
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={loading}>
            {loading ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </div>
      <div className="prose-rr">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{prd.markdown}</ReactMarkdown>
      </div>
    </Card>
  );
}
