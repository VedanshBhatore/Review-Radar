import { describe, expect, it } from "vitest";
import { chunkReviews } from "@/lib/batch";
import type { Review } from "@/lib/types";

function makeReviews(n: number): Review[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `r${i + 1}`,
    text: `review ${i + 1}`,
    rating: 3,
    date: "2026-01-01T00:00:00Z",
  }));
}

describe("chunkReviews", () => {
  it("returns an empty array for no reviews", () => {
    expect(chunkReviews([])).toEqual([]);
  });

  it("returns a single chunk when under the batch size", () => {
    const chunks = chunkReviews(makeReviews(50), 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(50);
  });

  it("splits into even chunks when evenly divisible", () => {
    const chunks = chunkReviews(makeReviews(200), 100);
    expect(chunks.map((c) => c.length)).toEqual([100, 100]);
  });

  it("puts the remainder in a final smaller chunk", () => {
    const chunks = chunkReviews(makeReviews(240), 100);
    expect(chunks.map((c) => c.length)).toEqual([100, 100, 40]);
  });

  it("preserves review order and ids across chunks", () => {
    const chunks = chunkReviews(makeReviews(10), 4);
    expect(chunks.flat().map((r) => r.id)).toEqual(makeReviews(10).map((r) => r.id));
  });
});
