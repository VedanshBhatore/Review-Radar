import type { AppMeta, PrdContent, Review, Theme } from "./types";

export type ReviewsApiResponse =
  | { status: "existing_report"; reportId: string; createdAt: string; appName: string }
  | { status: "ok"; app: AppMeta; reviews: Review[]; fromCache: boolean };

export interface ThemeBatchApiResponse {
  themes: import("./types").ThemeCandidate[];
}

export interface ThemeMergeApiResponse {
  themes: Theme[];
}

export interface CreateReportApiResponse {
  id: string;
  provider: string;
}

export interface PrdApiResponse {
  prd: PrdContent;
}

export interface RiceUpdateApiResponse {
  theme: Theme;
}
