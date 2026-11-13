import { Card } from "./ui/Card";
import type { AnalysisPhase } from "@/hooks/useAnalysis";

const STEPS: { phase: AnalysisPhase; label: string }[] = [
  { phase: "fetching", label: "Fetching reviews" },
  { phase: "theming", label: "Finding themes" },
  { phase: "merging", label: "Merging" },
  { phase: "saving", label: "Saving" },
];

function stepStatus(stepPhase: AnalysisPhase, currentPhase: AnalysisPhase): "done" | "active" | "pending" {
  const order: AnalysisPhase[] = ["fetching", "theming", "merging", "saving", "done"];
  const stepIndex = order.indexOf(stepPhase);
  const currentIndex = order.indexOf(currentPhase);
  if (currentIndex > stepIndex) return "done";
  if (currentIndex === stepIndex) return "active";
  return "pending";
}

export function ProgressScreen({ phase, message, progress }: { phase: AnalysisPhase; message: string; progress: number }) {
  return (
    <Card className="radar-sweep mx-auto w-full max-w-lg p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-brand" />
        </span>
        <h2 className="text-lg font-semibold">Analysing reviews...</h2>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${Math.max(progress, 4)}%` }}
        />
      </div>

      <p className="mb-6 text-sm text-foreground-muted" role="status" aria-live="polite">
        {message}
      </p>

      <ol className="space-y-3">
        {STEPS.map((step) => {
          const status = stepStatus(step.phase, phase);
          return (
            <li key={step.phase} className="flex items-center gap-3 text-sm">
              <span
                className={
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs " +
                  (status === "done"
                    ? "bg-good text-white"
                    : status === "active"
                      ? "bg-brand text-white"
                      : "bg-surface-muted text-foreground-muted")
                }
              >
                {status === "done" ? "✓" : ""}
              </span>
              <span className={status === "pending" ? "text-foreground-muted" : "font-medium"}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
