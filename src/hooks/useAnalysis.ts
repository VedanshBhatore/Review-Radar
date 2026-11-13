"use client";

import { useCallback, useRef, useState } from "react";
import { chunkReviews } from "@/lib/batch";
import { mapWithConcurrency } from "@/lib/concurrency";
import { postJson, ApiError } from "@/lib/api-client";
import type {
  CreateReportApiResponse,
  ReviewsApiResponse,
  ThemeBatchApiResponse,
  ThemeMergeApiResponse,
} from "@/lib/api-types";
import type { AppMeta, Review, ThemeCandidate } from "@/lib/types";
import { trackAnalysisCompleted, trackAnalysisFailed, trackAnalysisStarted } from "@/lib/analytics";

export type AnalysisPhase =
  | "idle"
  | "fetching"
  | "existing_report"
  | "theming"
  | "merging"
  | "saving"
  | "done"
  | "error";

export interface ExistingReportInfo {
  reportId: string;
  createdAt: string;
  appName: string;
  hoursAgo: number;
}

export interface AnalysisState {
  phase: AnalysisPhase;
  message: string;
  progress: number;
  reportId?: string;
  existingReport?: ExistingReportInfo;
  errorMessage?: string;
}

export type StartOptions =
  | { mode: "playstore"; input: string; force?: boolean }
  | { mode: "demo" }
  | { mode: "csv"; appName: string; reviews: Review[] };

const CONCURRENCY = 3;

const IDLE_STATE: AnalysisState = { phase: "idle", message: "", progress: 0 };

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(IDLE_STATE);
  const lastOptionsRef = useRef<StartOptions | null>(null);

  const runPipeline = useCallback(async (app: AppMeta, reviews: Review[], isDemo: boolean) => {
    const startedAt = Date.now();
    try {
      const chunks = chunkReviews(reviews);
      const totalBatches = chunks.length;
      let completed = 0;

      setState({
        phase: "theming",
        message: totalBatches > 0 ? `Finding themes (batch 0 of ${totalBatches})` : "Finding themes...",
        progress: 20,
      });

      const batchResults = await mapWithConcurrency(chunks, CONCURRENCY, async (chunk) => {
        const result = await postJson<ThemeBatchApiResponse>("/api/themes/batch", {
          reviews: chunk,
          appName: app.appName,
        });
        completed++;
        setState({
          phase: "theming",
          message: `Finding themes (batch ${completed} of ${totalBatches})`,
          progress: 20 + Math.round((completed / Math.max(totalBatches, 1)) * 40),
        });
        return result.themes;
      });

      const candidates: ThemeCandidate[] = batchResults.flat();

      setState({ phase: "merging", message: "Merging themes into a final list...", progress: 65 });
      const mergeResult = await postJson<ThemeMergeApiResponse>("/api/themes/merge", {
        candidates,
        reviews,
        appName: app.appName,
      });

      setState({ phase: "saving", message: "Saving report...", progress: 90 });
      const { id, provider } = await postJson<CreateReportApiResponse>("/api/reports", {
        app,
        reviews,
        themes: mergeResult.themes,
        isDemo,
      });

      setState({ phase: "done", message: "Done!", progress: 100, reportId: id });
      trackAnalysisCompleted({ durationMs: Date.now() - startedAt, reviewCount: reviews.length, provider });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong while analysing reviews.";
      setState({ phase: "error", message, progress: 0, errorMessage: message });
      trackAnalysisFailed({ reason: error instanceof ApiError ? error.reason ?? "unknown" : "unknown" });
    }
  }, []);

  const start = useCallback(
    async (options: StartOptions) => {
      lastOptionsRef.current = options;
      trackAnalysisStarted({ mode: options.mode });

      try {
        if (options.mode === "demo") {
          const { DEMO_APP, generateDemoReviews } = await import("@/lib/demo-data");
          setState({ phase: "fetching", message: "Loading demo reviews...", progress: 10 });
          await runPipeline(DEMO_APP, generateDemoReviews(), true);
          return;
        }

        if (options.mode === "csv") {
          const app: AppMeta = { appId: "csv-upload", appName: options.appName };
          setState({ phase: "fetching", message: "Reading uploaded reviews...", progress: 10 });
          await runPipeline(app, options.reviews, false);
          return;
        }

        setState({ phase: "fetching", message: "Fetching reviews from the Play Store...", progress: 5 });
        const result = await postJson<ReviewsApiResponse>("/api/reviews", {
          input: options.input,
          force: options.force,
        });

        if (result.status === "existing_report") {
          const hoursAgo = Math.max(
            1,
            Math.round((Date.now() - new Date(result.createdAt).getTime()) / (60 * 60 * 1000)),
          );
          setState({
            phase: "existing_report",
            message: "A report already exists for this app.",
            progress: 0,
            existingReport: {
              reportId: result.reportId,
              createdAt: result.createdAt,
              appName: result.appName,
              hoursAgo,
            },
          });
          return;
        }

        await runPipeline(result.app, result.reviews, false);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Something went wrong while fetching reviews.";
        setState({ phase: "error", message, progress: 0, errorMessage: message });
        trackAnalysisFailed({ reason: error instanceof ApiError ? error.reason ?? "unknown" : "unknown" });
      }
    },
    [runPipeline],
  );

  const rerunAnyway = useCallback(() => {
    const options = lastOptionsRef.current;
    if (options?.mode === "playstore") {
      start({ ...options, force: true });
    }
  }, [start]);

  const reset = useCallback(() => setState(IDLE_STATE), []);

  return { state, start, rerunAnyway, reset };
}
