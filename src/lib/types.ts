export const THEME_TYPES = [
  "bug",
  "feature_request",
  "ux",
  "pricing",
  "delivery",
  "support",
  "quality",
  "praise",
  "other",
] as const;

export type ThemeType = (typeof THEME_TYPES)[number];

export interface Review {
  id: string; // short id, e.g. "r1"
  text: string;
  rating: number; // 1-5
  date: string; // ISO date string
  userName?: string;
}

export interface ThemeCandidate {
  name: string;
  description: string;
  type: ThemeType;
  sentiment: number; // -1..1
  review_ids: string[];
  representative_review_ids: string[];
}

export interface ThemeRationale {
  impact: string;
  effort: string;
  merge?: string;
}

export interface Theme {
  id: string; // t1, t2...
  name: string;
  description: string;
  type: ThemeType;
  sentiment: number;
  review_ids: string[];
  representative_review_ids: string[];
  reach: number; // 1-10
  impact: 1 | 2 | 3;
  confidence: 50 | 80 | 100;
  effort: number; // 1-5
  score: number;
  rationale: ThemeRationale;
}

export interface LlmModelInfo {
  provider: "claude" | "gemini" | "mock";
  fastModel: string;
  smartModel: string;
}

export interface AppMeta {
  appId: string;
  appName: string;
  icon?: string;
  developer?: string;
  score?: number;
}

export interface ReviewsCache {
  appId: string;
  app: AppMeta;
  reviews: Review[];
  fetchedAt: string; // ISO
}

export interface PrdContent {
  markdown: string;
  generatedAt: string;
  model: string;
}

export interface FeedbackEntry {
  id: string;
  value: "up" | "down";
  comment?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  app: AppMeta;
  reviews: Review[];
  themes: Theme[];
  provider: LlmModelInfo;
  createdAt: string;
  isDemo: boolean;
  prds: Record<string, PrdContent>;
  feedback: FeedbackEntry[];
}

export interface AnalysisStepStatus {
  step: "fetching" | "theming" | "merging" | "saving" | "done" | "error";
  message: string;
  progress: number; // 0-100
}

export function isThemeType(value: string): value is ThemeType {
  return (THEME_TYPES as readonly string[]).includes(value);
}
