"use client";

import { useMemo, useState } from "react";
import { HeadlineStats } from "./HeadlineStats";
import { RiceTable } from "./RiceTable";
import { ThemeDetail } from "./ThemeDetail";
import {
  OneStarDriversChart,
  RatingDistributionChart,
  ThemeShareChart,
  WeeklyAvgRatingChart,
  WeeklyOneStarShareChart,
} from "./Charts";
import { computeHeadlineStats, oneStarDrivers, ratingDistribution, themeShare } from "@/lib/report-stats";
import { bucketReviewsByWeek } from "@/lib/weeks";
import { recomputeTheme } from "@/lib/rice";
import { patchJson, postJson } from "@/lib/api-client";
import type { RiceUpdateApiResponse, PrdApiResponse } from "@/lib/api-types";
import type { Report, Theme } from "@/lib/types";
import { trackPrdGenerated, trackRiceEdited } from "@/lib/analytics";

export function ReportView({ report }: { report: Report }) {
  const [themes, setThemes] = useState<Theme[]>(report.themes);
  const [prds, setPrds] = useState(report.prds);
  const [prdLoadingThemeId, setPrdLoadingThemeId] = useState<string | null>(null);
  const [prdError, setPrdError] = useState<string | null>(null);

  const stats = useMemo(() => computeHeadlineStats(report.reviews, themes), [report.reviews, themes]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(stats.topOpportunity?.id);

  const ratingBuckets = useMemo(() => ratingDistribution(report.reviews), [report.reviews]);
  const shareData = useMemo(() => themeShare(themes, report.reviews.length), [themes, report.reviews.length]);
  const weekBuckets = useMemo(() => bucketReviewsByWeek(report.reviews), [report.reviews]);
  const drivers = useMemo(() => oneStarDrivers(themes, report.reviews), [themes, report.reviews]);

  const selectedTheme = themes.find((t) => t.id === selectedThemeId) ?? null;

  async function handleEditRice(themeId: string, field: "impact" | "effort", value: number) {
    setThemes((prev) =>
      prev.map((t) => (t.id === themeId ? recomputeTheme({ ...t, [field]: value }, report.reviews.length) : t)),
    );
    trackRiceEdited({ themeId, field, value });

    try {
      const { theme } = await patchJson<RiceUpdateApiResponse>(
        `/api/reports/${report.id}/themes/${themeId}`,
        { [field]: value },
      );
      setThemes((prev) => prev.map((t) => (t.id === themeId ? theme : t)));
    } catch {
      // Keep the optimistic local value; the edit still works for this session
      // even if the persisted copy falls behind (e.g. local store race).
    }
  }

  async function handleGeneratePrd(themeId: string) {
    setPrdError(null);
    setPrdLoadingThemeId(themeId);
    try {
      const { prd } = await postJson<PrdApiResponse>(`/api/reports/${report.id}/prd`, { themeId });
      setPrds((prev) => ({ ...prev, [themeId]: prd }));
      const theme = themes.find((t) => t.id === themeId);
      if (theme) trackPrdGenerated({ themeId, themeType: theme.type });
    } catch (error) {
      setPrdError(error instanceof Error ? error.message : "Couldn't generate the PRD.");
    } finally {
      setPrdLoadingThemeId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{report.app.appName}</h1>
        <p className="text-sm text-foreground-muted">
          Analysed {new Date(report.createdAt).toLocaleString()} · provider: {report.provider.provider}
          {report.isDemo && " · demo data"}
        </p>
      </header>

      <section className="mb-8">
        <HeadlineStats stats={stats} />
      </section>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <RatingDistributionChart data={ratingBuckets} />
        <ThemeShareChart data={shareData} />
        <WeeklyAvgRatingChart data={weekBuckets} />
        <WeeklyOneStarShareChart data={weekBuckets} />
      </section>

      <section className="mb-8">
        <OneStarDriversChart data={drivers} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">RICE-scored opportunities</h2>
        <RiceTable
          themes={themes}
          onEditRice={handleEditRice}
          onSelectTheme={setSelectedThemeId}
          selectedThemeId={selectedThemeId}
        />
      </section>

      {selectedTheme && (
        <section>
          <ThemeDetail
            theme={selectedTheme}
            reviews={report.reviews}
            onGeneratePrd={() => handleGeneratePrd(selectedTheme.id)}
            prdLoading={prdLoadingThemeId === selectedTheme.id}
          />
          {prdError && <p className="mt-2 text-sm text-danger">{prdError}</p>}
          {prds[selectedTheme.id] && (
            <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
              <p className="mb-2 text-xs font-medium text-foreground-muted">
                PRD (generated {new Date(prds[selectedTheme.id].generatedAt).toLocaleString()})
              </p>
              <pre className="whitespace-pre-wrap font-sans text-sm">{prds[selectedTheme.id].markdown}</pre>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
