import type { Review } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the ISO date (YYYY-MM-DD, UTC) of the Monday that starts the week
 * containing the given date. Used as a stable, sortable bucket key.
 */
export function getWeekKey(dateIso: string): string {
  const d = new Date(dateIso);
  const utcMidnight = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayOfWeek = utcMidnight.getUTCDay(); // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(utcMidnight.getTime() - diffToMonday * DAY_MS);
  return monday.toISOString().slice(0, 10);
}

export interface WeekBucket {
  week: string; // YYYY-MM-DD (Monday)
  reviewCount: number;
  avgRating: number;
  oneStarShare: number; // 0-1
}

/**
 * Buckets reviews by week, sorted chronologically ascending. Empty input -> [].
 */
export function bucketReviewsByWeek(reviews: Review[]): WeekBucket[] {
  const groups = new Map<string, Review[]>();

  for (const review of reviews) {
    const key = getWeekKey(review.date);
    const group = groups.get(key);
    if (group) {
      group.push(review);
    } else {
      groups.set(key, [review]);
    }
  }

  const buckets: WeekBucket[] = Array.from(groups.entries()).map(([week, group]) => {
    const total = group.reduce((sum, r) => sum + r.rating, 0);
    const oneStarCount = group.filter((r) => r.rating === 1).length;
    return {
      week,
      reviewCount: group.length,
      avgRating: Math.round((total / group.length) * 100) / 100,
      oneStarShare: Math.round((oneStarCount / group.length) * 10000) / 10000,
    };
  });

  return buckets.sort((a, b) => (a.week < b.week ? -1 : a.week > b.week ? 1 : 0));
}
