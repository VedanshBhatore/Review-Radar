import { describe, expect, it } from "vitest";
import { generateDemoReviews } from "@/lib/demo-data";

describe("generateDemoReviews", () => {
  it("is deterministic for a fixed `now`", () => {
    const now = new Date("2026-11-13T00:00:00Z");
    const a = generateDemoReviews(now);
    const b = generateDemoReviews(now);
    expect(a).toEqual(b);
  });

  it("produces a sizeable, varied dataset", () => {
    const reviews = generateDemoReviews(new Date("2026-11-13T00:00:00Z"));
    expect(reviews.length).toBeGreaterThan(100);
    const ratings = new Set(reviews.map((r) => r.rating));
    expect(ratings.size).toBeGreaterThan(1);
  });

  it("assigns unique sequential ids", () => {
    const reviews = generateDemoReviews(new Date("2026-11-13T00:00:00Z"));
    const ids = reviews.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("r1");
  });

  it("only produces dates on or before `now`", () => {
    const now = new Date("2026-11-13T00:00:00Z");
    const reviews = generateDemoReviews(now);
    for (const r of reviews) {
      expect(new Date(r.date).getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });
});
