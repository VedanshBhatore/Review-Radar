import { describe, expect, it } from "vitest";
import {
  clamp,
  compareThemesByRank,
  computeConfidence,
  computeReach,
  computeRiceScore,
  sortThemesByRank,
} from "@/lib/rice";
import type { Theme } from "@/lib/types";

function makeTheme(partial: Partial<Theme>): Theme {
  return {
    id: "t1",
    name: "Theme",
    description: "desc",
    type: "bug",
    sentiment: -0.5,
    review_ids: ["r1"],
    representative_review_ids: ["r1"],
    reach: 5,
    impact: 2,
    confidence: 80,
    effort: 2,
    score: 1,
    rationale: { impact: "", effort: "" },
    ...partial,
  };
}

describe("clamp", () => {
  it("clamps within bounds", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-5, 1, 10)).toBe(1);
    expect(clamp(50, 1, 10)).toBe(10);
  });
});

describe("computeReach", () => {
  it("maps 5% mention share to 1", () => {
    expect(computeReach(5, 100)).toBe(1);
  });

  it("maps 50% mention share to 10", () => {
    expect(computeReach(50, 100)).toBe(10);
  });

  it("clamps shares above 50% to 10", () => {
    expect(computeReach(90, 100)).toBe(10);
  });

  it("clamps shares below 5% to 1", () => {
    expect(computeReach(1, 1000)).toBe(1);
  });

  it("guards against zero total reviews", () => {
    expect(computeReach(0, 0)).toBe(1);
  });

  it("guards against zero mentions", () => {
    expect(computeReach(0, 100)).toBe(1);
  });
});

describe("computeConfidence", () => {
  it("returns 100 for 30+ mentions", () => {
    expect(computeConfidence(30)).toBe(100);
    expect(computeConfidence(31)).toBe(100);
  });

  it("returns 80 for 10-29 mentions", () => {
    expect(computeConfidence(10)).toBe(80);
    expect(computeConfidence(29)).toBe(80);
  });

  it("returns 50 for under 10 mentions", () => {
    expect(computeConfidence(9)).toBe(50);
    expect(computeConfidence(0)).toBe(50);
  });
});

describe("computeRiceScore", () => {
  it("computes reach * impact * confidence / effort", () => {
    // 8 * 3 * 1.0 / 2 = 12
    expect(computeRiceScore({ reach: 8, impact: 3, confidence: 100, effort: 2 })).toBe(12);
  });

  it("handles fractional confidence", () => {
    // 4 * 2 * 0.8 / 4 = 1.6
    expect(computeRiceScore({ reach: 4, impact: 2, confidence: 80, effort: 4 })).toBe(1.6);
  });

  it("guards against zero effort", () => {
    expect(computeRiceScore({ reach: 10, impact: 3, confidence: 100, effort: 0 })).toBe(30);
  });
});

describe("compareThemesByRank / sortThemesByRank", () => {
  it("sorts by score descending", () => {
    const a = makeTheme({ id: "a", score: 5 });
    const b = makeTheme({ id: "b", score: 10 });
    const c = makeTheme({ id: "c", score: 1 });
    expect(sortThemesByRank([a, b, c]).map((t) => t.id)).toEqual(["b", "a", "c"]);
  });

  it("always pushes praise themes last regardless of score", () => {
    const praise = makeTheme({ id: "praise", type: "praise", score: 999 });
    const bug = makeTheme({ id: "bug", type: "bug", score: 1 });
    expect(sortThemesByRank([praise, bug]).map((t) => t.id)).toEqual(["bug", "praise"]);
  });

  it("sorts multiple praise themes among themselves by score, still last", () => {
    const praiseHigh = makeTheme({ id: "p1", type: "praise", score: 50 });
    const praiseLow = makeTheme({ id: "p2", type: "praise", score: 10 });
    const bug = makeTheme({ id: "bug", type: "bug", score: 1 });
    const sorted = sortThemesByRank([praiseHigh, bug, praiseLow]);
    expect(sorted.map((t) => t.id)).toEqual(["bug", "p1", "p2"]);
  });

  it("is a pure comparator usable with Array.sort directly", () => {
    const themes = [makeTheme({ id: "a", score: 1 }), makeTheme({ id: "b", score: 2 })];
    expect([...themes].sort(compareThemesByRank).map((t) => t.id)).toEqual(["b", "a"]);
  });
});
