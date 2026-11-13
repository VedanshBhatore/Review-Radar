import { describe, expect, it } from "vitest";
import { reviewsFromCsvRows } from "@/lib/csv";

describe("reviewsFromCsvRows", () => {
  it("converts valid rows into Review objects with sequential ids", () => {
    const { reviews, skipped } = reviewsFromCsvRows([
      { text: "Great app", rating: "5", date: "2026-01-01" },
      { text: "Crashes a lot", rating: 1, date: "2026-01-02" },
    ]);
    expect(skipped).toBe(0);
    expect(reviews).toHaveLength(2);
    expect(reviews[0]).toMatchObject({ id: "r1", text: "Great app", rating: 5 });
    expect(reviews[1]).toMatchObject({ id: "r2", text: "Crashes a lot", rating: 1 });
  });

  it("skips rows with missing text", () => {
    const { reviews, skipped } = reviewsFromCsvRows([{ text: "", rating: 3, date: "2026-01-01" }]);
    expect(reviews).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it("skips rows with out-of-range ratings", () => {
    const { reviews, skipped } = reviewsFromCsvRows([{ text: "ok", rating: 7, date: "2026-01-01" }]);
    expect(reviews).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it("skips rows with unparseable dates", () => {
    const { reviews, skipped } = reviewsFromCsvRows([{ text: "ok", rating: 3, date: "not-a-date" }]);
    expect(reviews).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it("continues assigning ids past skipped rows", () => {
    const { reviews, skipped } = reviewsFromCsvRows([
      { text: "good", rating: 5, date: "2026-01-01" },
      { text: "", rating: 3, date: "2026-01-01" },
      { text: "bad", rating: 1, date: "2026-01-02" },
    ]);
    expect(skipped).toBe(1);
    expect(reviews.map((r) => r.id)).toEqual(["r1", "r2"]);
  });
});
