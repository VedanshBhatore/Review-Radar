import type { Review, Theme } from "./types";
import { sortThemesByRank } from "./rice";

export interface HeadlineStats {
  reviewCount: number;
  avgRating: number;
  oneStarSharePct: number;
  topOpportunity: Theme | null;
}

export function computeHeadlineStats(reviews: Review[], themes: Theme[]): HeadlineStats {
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  const oneStarCount = reviews.filter((r) => r.rating === 1).length;
  const oneStarSharePct = reviewCount > 0 ? (oneStarCount / reviewCount) * 100 : 0;

  const ranked = sortThemesByRank(themes);
  const topOpportunity = ranked.find((t) => t.type !== "praise") ?? null;

  return {
    reviewCount,
    avgRating: Math.round(avgRating * 100) / 100,
    oneStarSharePct: Math.round(oneStarSharePct * 10) / 10,
    topOpportunity,
  };
}

export interface RatingBucket {
  rating: number;
  count: number;
}

export function ratingDistribution(reviews: Review[]): RatingBucket[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  }
  return counts.map((count, i) => ({ rating: i + 1, count }));
}

export interface ThemeShare {
  themeId: string;
  name: string;
  type: Theme["type"];
  pct: number;
  count: number;
}

export function themeShare(themes: Theme[], totalReviews: number): ThemeShare[] {
  return [...themes]
    .map((t) => ({
      themeId: t.id,
      name: t.name,
      type: t.type,
      count: t.review_ids.length,
      pct: totalReviews > 0 ? Math.round((t.review_ids.length / totalReviews) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export interface OneStarDriver {
  themeId: string;
  name: string;
  oneStarCount: number;
}

/** Themes ranked by how many of their mentions are 1-star reviews. */
export function oneStarDrivers(themes: Theme[], reviews: Review[], limit = 8): OneStarDriver[] {
  const ratingById = new Map(reviews.map((r) => [r.id, r.rating]));
  return themes
    .map((t) => ({
      themeId: t.id,
      name: t.name,
      oneStarCount: t.review_ids.filter((id) => ratingById.get(id) === 1).length,
    }))
    .filter((d) => d.oneStarCount > 0)
    .sort((a, b) => b.oneStarCount - a.oneStarCount)
    .slice(0, limit);
}
