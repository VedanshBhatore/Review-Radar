"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/hooks/useAnalysis";
import { ProgressScreen } from "@/components/ProgressScreen";
import { CsvUpload } from "@/components/CsvUpload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getOnboardingVariant,
  trackDemoClicked,
  trackLandingViewed,
  trackSampleClicked,
} from "@/lib/analytics";
import type { Review } from "@/lib/types";

const SAMPLE_APPS = [
  { name: "Blinkit", appId: "com.grofers.customerapp" },
  { name: "Zepto", appId: "com.zeptoconsumerapp" },
  { name: "Swiggy", appId: "in.swiggy.android" },
];

export default function HomePage() {
  const router = useRouter();
  const { state, start, rerunAnyway, reset } = useAnalysis();
  const [input, setInput] = useState("");
  // Lazy initializer (not an effect): a one-shot read at mount time, which
  // matches the spec's "fall back to test" default since PostHog's flag
  // resolution is async anyway and won't be ready synchronously regardless.
  const [variant] = useState<"control" | "test">(() => getOnboardingVariant());
  const [showCsv, setShowCsv] = useState(false);

  useEffect(() => {
    trackLandingViewed();
  }, []);

  useEffect(() => {
    if (state.phase === "done" && state.reportId) {
      router.push(`/r/${state.reportId}`);
    }
  }, [state.phase, state.reportId, router]);

  const isBusy = state.phase !== "idle" && state.phase !== "error" && state.phase !== "existing_report";

  if (isBusy) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <ProgressScreen phase={state.phase} message={state.message} progress={state.progress} />
      </main>
    );
  }

  if (state.phase === "existing_report" && state.existingReport) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold">Already analysed recently</h2>
          <p className="mb-6 text-sm text-foreground-muted">
            {state.existingReport.appName} was analysed about {state.existingReport.hoursAgo}h ago.
            You can view that report, or re-run the analysis to get fresh reviews and themes.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push(`/r/${state.existingReport!.reportId}`)}>
              View report
            </Button>
            <Button variant="secondary" onClick={rerunAnyway}>
              Re-run anyway
            </Button>
          </div>
          <button
            onClick={reset}
            className="mt-4 text-xs text-foreground-muted underline-offset-2 hover:underline"
          >
            Cancel
          </button>
        </Card>
      </main>
    );
  }

  return (
    <main className="radar-sweep flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          ReviewRadar
        </h1>
        <p className="mt-4 text-lg text-foreground-muted">
          Turn thousands of unread Play Store reviews into a RICE-scored roadmap and a one-page
          PRD -- in minutes, not a gut feeling.
        </p>

        <Card className="mt-10 p-6 text-left">
          <label htmlFor="app-input" className="mb-2 block text-sm font-medium">
            Paste a Play Store app ID or URL
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) start({ mode: "playstore", input: input.trim() });
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              id="app-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="com.grofers.customerapp"
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
            <Button type="submit" disabled={!input.trim()}>
              Analyze
            </Button>
          </form>

          {state.phase === "error" && (
            <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.errorMessage}
            </p>
          )}

          {variant === "test" && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-foreground-muted">Try a sample app:</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_APPS.map((app) => (
                  <button
                    key={app.appId}
                    type="button"
                    onClick={() => {
                      trackSampleClicked(app.appId);
                      setInput(app.appId);
                      start({ mode: "playstore", input: app.appId });
                    }}
                    className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand-strong transition-colors hover:bg-brand/20"
                  >
                    {app.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                trackDemoClicked();
                start({ mode: "demo" });
              }}
            >
              Try the demo (no network needed)
            </Button>
            <button
              type="button"
              onClick={() => setShowCsv((v) => !v)}
              className="text-sm text-foreground-muted underline-offset-2 hover:underline"
            >
              {showCsv ? "Hide CSV upload" : "Or upload a CSV of reviews"}
            </button>
          </div>

          {showCsv && (
            <div className="mt-4">
              <CsvUpload
                onParsed={(appName, reviews: Review[]) => start({ mode: "csv", appName, reviews })}
              />
            </div>
          )}
        </Card>

        <p className="mt-6 text-xs text-foreground-muted">
          Built for PMs, founders, and PM students. No signup needed to try the demo.
        </p>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {[
            {
              title: "1. Fetch reviews",
              body: "Up to 500 recent Play Store reviews, or your own CSV export.",
            },
            {
              title: "2. Theme & score",
              body: "An LLM groups reviews into themes, each scored with RICE (reach, impact, confidence, effort).",
            },
            {
              title: "3. Draft a PRD",
              body: "One click turns any theme into a one-page PRD with real quotes and metrics.",
            },
          ].map((step) => (
            <Card key={step.title} className="p-5">
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-foreground-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
