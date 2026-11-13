import { describe, expect, it } from "vitest";
import { bucketReviewsByWeek, getWeekKey } from "@/lib/weeks";
import type { Review } from "@/lib/types";

function review(id: string, rating: number, date: string): Review {
  return { id, rating, date, text: "x" };
}

describe("getWeekKey", () => {
  it("returns the Monday of the week for a mid-week date", () => {
    // 2026-11-13 is a Friday
    expect(getWeekKey("2026-11-13T10:00:00Z")).toBe("2026-11-09");
  });

  it("returns the same key for a Monday itself", () => {
    expect(getWeekKey("2026-11-09T00:00:00Z")).toBe("2026-11-09");
  });

  it("handles a Sunday correctly (rolls back to prior Monday)", () => {
    expect(getWeekKey("2026-11-15T23:59:59Z")).toBe("2026-11-09");
  });
});

describe("bucketReviewsByWeek", () => {
  it("returns an empty array for no reviews", () => {
    expect(bucketReviewsByWeek([])).toEqual([]);
  });

  it("groups reviews into weekly buckets sorted chronologically", () => {
    const reviews = [
      review("r1", 5, "2026-11-13T00:00:00Z"),
      review("r2", 1, "2026-11-14T00:00:00Z"),
      review("r3", 3, "2026-11-02T00:00:00Z"),
    ];
    const buckets = bucketReviewsByWeek(reviews);
    expect(buckets.map((b) => b.week)).toEqual(["2026-11-02", "2026-11-09"]);
    expect(buckets[1].reviewCount).toBe(2);
  });

  it("computes avg rating and 1-star share per bucket", () => {
    const reviews = [
      review("r1", 1, "2026-11-13T00:00:00Z"),
      review("r2", 5, "2026-11-13T00:00:00Z"),
      review("r3", 1, "2026-11-13T00:00:00Z"),
      review("r4", 3, "2026-11-13T00:00:00Z"),
    ];
    const [bucket] = bucketReviewsByWeek(reviews);
    expect(bucket.avgRating).toBe(2.5);
    expect(bucket.oneStarShare).toBe(0.5);
  });
});
