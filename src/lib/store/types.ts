import type { FeedbackEntry, PrdContent, Report, ReviewsCache, Theme } from "../types";

export interface Store {
  getReviewsCache(appId: string): Promise<ReviewsCache | null>;
  saveReviewsCache(cache: ReviewsCache): Promise<void>;

  createReport(report: Report): Promise<void>;
  getReport(id: string): Promise<Report | null>;

  /** Most recent report for this app within `withinHours`, if any (for the "a report already exists" check). */
  findRecentReportForApp(appId: string, withinHours: number): Promise<Report | null>;

  savePrd(reportId: string, themeId: string, prd: PrdContent): Promise<Report | null>;
  saveFeedback(reportId: string, feedback: FeedbackEntry): Promise<Report | null>;
  updateThemeRice(
    reportId: string,
    themeId: string,
    patch: { impact?: number; effort?: number },
  ): Promise<Theme | null>;
}
