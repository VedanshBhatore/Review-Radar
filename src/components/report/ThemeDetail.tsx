import { Card } from "@/components/ui/Card";
import { ThemeTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Review, Theme } from "@/lib/types";

export function ThemeDetail({
  theme,
  reviews,
  onGeneratePrd,
  prdLoading,
}: {
  theme: Theme;
  reviews: Review[];
  onGeneratePrd: () => void;
  prdLoading: boolean;
}) {
  const reviewsById = new Map(reviews.map((r) => [r.id, r]));
  const quotes = theme.representative_review_ids
    .map((id) => reviewsById.get(id))
    .filter((r): r is Review => Boolean(r));

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{theme.name}</h3>
            <ThemeTypeBadge type={theme.type} />
          </div>
          <p className="mt-1 text-sm text-foreground-muted">{theme.description}</p>
        </div>
        <Button size="sm" onClick={onGeneratePrd} disabled={prdLoading}>
          {prdLoading ? "Generating..." : "Generate PRD"}
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-foreground-muted">Mentions</dt>
          <dd className="font-medium">{theme.review_ids.length}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Sentiment</dt>
          <dd className="font-medium">{theme.sentiment.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">RICE score</dt>
          <dd className="font-medium">{theme.score}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Confidence</dt>
          <dd className="font-medium">{theme.confidence}%</dd>
        </div>
      </dl>

      {theme.rationale.merge && (
        <p className="mt-3 text-xs text-foreground-muted">Merge note: {theme.rationale.merge}</p>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-foreground-muted">Real review quotes</p>
        <ul className="space-y-2">
          {quotes.length === 0 && <li className="text-sm text-foreground-muted">No quotes available.</li>}
          {quotes.map((q) => (
            <li key={q.id} className="rounded-lg bg-surface-muted p-3 text-sm">
              <p>&ldquo;{q.text}&rdquo;</p>
              <p className="mt-1 text-xs text-foreground-muted">
                {q.rating}★ · {new Date(q.date).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
