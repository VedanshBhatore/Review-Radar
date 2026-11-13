import type { Theme } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Reach = share of reviews mentioning the theme x 20, clamped to 1-10.
 * 5% mention share -> 1, 50%+ mention share -> 10.
 * Guards totalReviews === 0 to avoid NaN/Infinity.
 */
export function computeReach(mentionCount: number, totalReviews: number): number {
  if (totalReviews <= 0) return 1;
  const share = mentionCount / totalReviews;
  return clamp(Math.round(share * 20), 1, 10);
}

/**
 * Confidence: 100% at 30+ mentions, 80% at 10+, else 50%.
 */
export function computeConfidence(mentionCount: number): 50 | 80 | 100 {
  if (mentionCount >= 30) return 100;
  if (mentionCount >= 10) return 80;
  return 50;
}

export interface RiceInputs {
  reach: number; // 1-10
  impact: number; // 1-3
  confidence: number; // 50 | 80 | 100
  effort: number; // 1-5 (minimum 1 to avoid divide-by-zero)
}

/**
 * Score = Reach x Impact x Confidence / Effort (confidence as 0-1 fraction).
 */
export function computeRiceScore({ reach, impact, confidence, effort }: RiceInputs): number {
  const safeEffort = effort <= 0 ? 1 : effort;
  const score = (reach * impact * (confidence / 100)) / safeEffort;
  return Math.round(score * 100) / 100;
}

/**
 * Sort themes by RICE score descending, with "praise" themes always pushed to the
 * bottom regardless of score (they're validation signal, not a roadmap item).
 */
export function compareThemesByRank(a: Theme, b: Theme): number {
  const aPraise = a.type === "praise";
  const bPraise = b.type === "praise";
  if (aPraise !== bPraise) return aPraise ? 1 : -1;
  return b.score - a.score;
}

export function sortThemesByRank(themes: Theme[]): Theme[] {
  return [...themes].sort(compareThemesByRank);
}

/**
 * Recomputes reach/confidence/score for a theme from its current review_ids
 * against the full review set, keeping impact/effort (editable by the user).
 */
export function recomputeTheme(theme: Theme, totalReviews: number): Theme {
  const mentionCount = theme.review_ids.length;
  const reach = computeReach(mentionCount, totalReviews);
  const confidence = computeConfidence(mentionCount);
  const score = computeRiceScore({
    reach,
    impact: theme.impact,
    confidence,
    effort: theme.effort,
  });
  return { ...theme, reach, confidence, score };
}
