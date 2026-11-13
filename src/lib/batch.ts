import type { Review } from "./types";

export const DEFAULT_BATCH_SIZE = 100;

/**
 * Splits reviews into ~100-review chunks for the /api/themes/batch step.
 * The last chunk absorbs the remainder (never produces a tiny trailing chunk
 * of just 1-2 reviews unless the whole input is that small).
 */
export function chunkReviews(reviews: Review[], size: number = DEFAULT_BATCH_SIZE): Review[][] {
  if (reviews.length === 0) return [];
  const chunks: Review[][] = [];
  for (let i = 0; i < reviews.length; i += size) {
    chunks.push(reviews.slice(i, i + size));
  }
  return chunks;
}
