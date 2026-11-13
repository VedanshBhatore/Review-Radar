import { describe, expect, it } from "vitest";
import {
  computeHeadlineStats,
  oneStarDrivers,
  ratingDistribution,
  themeShare,
} from "@/lib/report-stats";
import type { Review, Theme } from "@/lib/types";

function review(id: string, rating: number): Review {
  return { id, rating, date: "2026-01-01T00:00:00Z", text: "x" };
}

function theme(partial: Partial<Theme>): Theme {
  return {
    id: "t1",
    name: "Theme",
    description: "d",
    type: "bug",
    sentiment: 0,
    review_ids: [],
    representative_review_ids: [],
    reach: 1,
    impact: 2,
    confidence: 50,
    effort: 2,
    score: 1,
    rationale: { impact: "", effort: "" },
    ...partial,
  };
}

describe("computeHeadlineStats", () => {
  it("computes review count, avg rating, and 1-star share", () => {
    const reviews = [review("r1", 1), review("r2", 5), review("r3", 1), review("r4", 3)];
    const stats = computeHeadlineStats(reviews, []);
    expect(stats.reviewCount).toBe(4);
    expect(stats.avgRating).toBe(2.5);
    expect(stats.oneStarSharePct).toBe(50);
  });

  it("handles zero reviews without dividing by zero", () => {
    const stats = computeHeadlineStats([], []);
    expect(stats).toMatchObject({ reviewCount: 0, avgRating: 0, oneStarSharePct: 0, topOpportunity: null });
  });

  it("picks the highest-scoring non-praise theme as the top opportunity", () => {
    const themes = [
      theme({ id: "praise", type: "praise", score: 999 }),
      theme({ id: "bug", type: "bug", score: 5 }),
      theme({ id: "pricing", type: "pricing", score: 10 }),
    ];
    const stats = computeHeadlineStats([], themes);
    expect(stats.topOpportunity?.id).toBe("pricing");
  });

  it("returns null top opportunity when every theme is praise", () => {
    const stats = computeHeadlineStats([], [theme({ type: "praise" })]);
    expect(stats.topOpportunity).toBeNull();
  });
});

describe("ratingDistribution", () => {
  it("buckets reviews by rating 1-5", () => {
    const reviews = [review("r1", 1), review("r2", 1), review("r3", 5)];
    expect(ratingDistribution(reviews)).toEqual([
      { rating: 1, count: 2 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 1 },
    ]);
  });
});

describe("themeShare", () => {
  it("computes percentage share and sorts descending by count", () => {
    const themes = [
      theme({ id: "a", name: "A", review_ids: ["r1"] }),
      theme({ id: "b", name: "B", review_ids: ["r1", "r2", "r3"] }),
    ];
    const result = themeShare(themes, 10);
    expect(result.map((t) => t.themeId)).toEqual(["b", "a"]);
    expect(result[0].pct).toBe(30);
    expect(result[1].pct).toBe(10);
  });
});

describe("oneStarDrivers", () => {
  it("ranks themes by their count of 1-star reviews", () => {
    const reviews = [review("r1", 1), review("r2", 1), review("r3", 5)];
    const themes = [
      theme({ id: "a", name: "A", review_ids: ["r1", "r3"] }),
      theme({ id: "b", name: "B", review_ids: ["r1", "r2"] }),
    ];
    const result = oneStarDrivers(themes, reviews);
    expect(result).toEqual([
      { themeId: "b", name: "B", oneStarCount: 2 },
      { themeId: "a", name: "A", oneStarCount: 1 },
    ]);
  });

  it("excludes themes with zero 1-star mentions", () => {
    const reviews = [review("r1", 5)];
    const themes = [theme({ id: "a", review_ids: ["r1"] })];
    expect(oneStarDrivers(themes, reviews)).toEqual([]);
  });
});
