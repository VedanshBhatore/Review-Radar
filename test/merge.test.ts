import { describe, expect, it } from "vitest";
import { buildFinalThemes, type MergeGroupInput } from "@/lib/merge";
import type { Review, ThemeCandidate } from "@/lib/types";

function review(id: string, rating = 3): Review {
  return { id, rating, date: "2026-01-01T00:00:00Z", text: `review ${id}` };
}

function candidate(partial: Partial<ThemeCandidate>): ThemeCandidate {
  return {
    name: "Candidate",
    description: "desc",
    type: "bug",
    sentiment: -0.5,
    review_ids: [],
    representative_review_ids: [],
    ...partial,
  };
}

function group(partial: Partial<MergeGroupInput>): MergeGroupInput {
  return {
    name: "Merged",
    description: "desc",
    type: "bug",
    candidate_indices: [],
    impact: 2,
    effort: 2,
    impact_rationale: "impact rationale",
    effort_rationale: "effort rationale",
    ...partial,
  };
}

describe("buildFinalThemes", () => {
  const reviews = [
    review("r1"),
    review("r2"),
    review("r3"),
    review("r4"),
    review("r5"),
  ];

  it("unions review ids across merged candidates without duplicates", () => {
    const candidates = [
      candidate({ review_ids: ["r1", "r2"], representative_review_ids: ["r1"] }),
      candidate({ review_ids: ["r2", "r3"], representative_review_ids: ["r3"] }),
    ];
    const groups = [group({ candidate_indices: [0, 1] })];
    const [theme] = buildFinalThemes(candidates, groups, reviews);
    expect(theme.review_ids.sort()).toEqual(["r1", "r2", "r3"]);
  });

  it("drops review ids and representative ids that don't exist in the review set", () => {
    const candidates = [
      candidate({
        review_ids: ["r1", "rGHOST"],
        representative_review_ids: ["rGHOST", "r1"],
      }),
    ];
    const groups = [group({ candidate_indices: [0] })];
    const [theme] = buildFinalThemes(candidates, groups, reviews);
    expect(theme.review_ids).toEqual(["r1"]);
    expect(theme.representative_review_ids).toEqual(["r1"]);
  });

  it("drops invalid candidate indices (out of range or negative) instead of throwing", () => {
    const candidates = [candidate({ review_ids: ["r1"] })];
    const groups = [group({ candidate_indices: [0, 5, -1, 99] })];
    const themes = buildFinalThemes(candidates, groups, reviews);
    expect(themes).toHaveLength(1);
    expect(themes[0].review_ids).toEqual(["r1"]);
  });

  it("drops a group entirely if every one of its indices is invalid", () => {
    const candidates = [candidate({ review_ids: ["r1"] })];
    const groups = [group({ candidate_indices: [7, 8] })];
    const themes = buildFinalThemes(candidates, groups, reviews);
    // the one candidate still survives as a "forgotten" theme if it has 3+ reviews;
    // here it only has 1, so nothing is produced at all.
    expect(themes).toHaveLength(0);
  });

  it("never lets a candidate be used by two different groups (first group wins)", () => {
    const candidates = [
      candidate({ review_ids: ["r1", "r2"] }),
      candidate({ review_ids: ["r3"] }),
    ];
    const groups = [
      group({ name: "First", candidate_indices: [0, 1] }),
      group({ name: "Second", candidate_indices: [0] }), // 0 already used
    ];
    const themes = buildFinalThemes(candidates, groups, reviews);
    expect(themes).toHaveLength(1);
    expect(themes[0].name).toBe("First");
    expect(themes[0].review_ids.sort()).toEqual(["r1", "r2", "r3"]);
  });

  it("keeps a candidate the model forgot as its own theme if it has 3+ reviews", () => {
    const candidates = [
      candidate({ name: "Grouped", review_ids: ["r1"] }),
      candidate({ name: "Forgotten", review_ids: ["r2", "r3", "r4"] }),
    ];
    const groups = [group({ candidate_indices: [0] })];
    const themes = buildFinalThemes(candidates, groups, reviews);
    expect(themes).toHaveLength(2);
    const forgotten = themes.find((t) => t.name === "Forgotten");
    expect(forgotten).toBeDefined();
    expect(forgotten!.review_ids.sort()).toEqual(["r2", "r3", "r4"]);
  });

  it("drops a forgotten candidate with fewer than 3 valid reviews", () => {
    const candidates = [
      candidate({ name: "Grouped", review_ids: ["r1"] }),
      candidate({ name: "TooSmall", review_ids: ["r2", "r3"] }),
    ];
    const groups = [group({ candidate_indices: [0] })];
    const themes = buildFinalThemes(candidates, groups, reviews);
    expect(themes.map((t) => t.name)).toEqual(["Merged"]);
  });

  it("produces no themes for empty candidates and groups", () => {
    expect(buildFinalThemes([], [], reviews)).toEqual([]);
  });

  it("computes a weighted-average sentiment across merged candidates", () => {
    const candidates = [
      candidate({ sentiment: -1, review_ids: ["r1", "r2"] }), // weight 2
      candidate({ sentiment: 1, review_ids: ["r3"] }), // weight 1
    ];
    const groups = [group({ candidate_indices: [0, 1] })];
    const [theme] = buildFinalThemes(candidates, groups, reviews);
    // (-1*2 + 1*1) / 3 = -0.33
    expect(theme.sentiment).toBeCloseTo(-0.33, 2);
  });

  it("assigns sequential ids across merged and forgotten themes", () => {
    const candidates = [
      candidate({ review_ids: ["r1"] }),
      candidate({ review_ids: ["r2", "r3", "r4"] }),
    ];
    const groups = [group({ candidate_indices: [0] })];
    const themes = buildFinalThemes(candidates, groups, reviews);
    expect(themes.map((t) => t.id)).toEqual(["t1", "t2"]);
  });
});
