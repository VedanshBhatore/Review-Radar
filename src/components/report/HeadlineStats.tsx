import { Card } from "@/components/ui/Card";
import type { HeadlineStats as Stats } from "@/lib/report-stats";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-foreground-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-foreground-muted">{sub}</p>}
    </Card>
  );
}

export function HeadlineStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile label="Reviews analysed" value={stats.reviewCount.toLocaleString()} />
      <StatTile label="Average rating" value={`${stats.avgRating.toFixed(2)} / 5`} />
      <StatTile label="1-star share" value={`${stats.oneStarSharePct}%`} />
      <StatTile
        label="Top opportunity"
        value={stats.topOpportunity ? stats.topOpportunity.name : "—"}
        sub={stats.topOpportunity ? `RICE score ${stats.topOpportunity.score}` : "No actionable themes yet"}
      />
    </div>
  );
}
