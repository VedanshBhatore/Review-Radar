"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/api-client";
import { trackFeedbackSubmitted } from "@/lib/analytics";

export function FeedbackWidget({ reportId }: { reportId: string }) {
  const [value, setValue] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!value) return;
    setSubmitting(true);
    setError(null);
    try {
      await postJson("/api/feedback", { reportId, value, comment: comment.trim() || undefined });
      trackFeedbackSubmitted({ value });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="no-print p-5 text-sm text-foreground-muted">
        Thanks for the feedback!
      </Card>
    );
  }

  return (
    <Card className="no-print p-5">
      <p className="mb-3 text-sm font-medium">Was this report useful?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setValue("up")}
          aria-pressed={value === "up"}
          className={`rounded-lg border px-3 py-1.5 text-lg transition-colors ${
            value === "up" ? "border-brand bg-brand/10" : "border-border hover:bg-surface-muted"
          }`}
        >
          👍
        </button>
        <button
          type="button"
          onClick={() => setValue("down")}
          aria-pressed={value === "down"}
          className={`rounded-lg border px-3 py-1.5 text-lg transition-colors ${
            value === "down" ? "border-brand bg-brand/10" : "border-border hover:bg-surface-muted"
          }`}
        >
          👎
        </button>
      </div>

      {value && (
        <div className="mt-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional: what worked or didn't? (not required)"
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <Button size="sm" className="mt-2" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Send feedback"}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  );
}
