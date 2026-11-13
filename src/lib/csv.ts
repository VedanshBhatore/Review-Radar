import { csvReviewRowSchema } from "./schemas";
import type { Review } from "./types";

export interface CsvImportResult {
  reviews: Review[];
  skipped: number;
}

/**
 * Converts raw parsed CSV rows (text,rating,date columns, any extra columns ignored)
 * into validated Review[] with short ids. Invalid rows (missing text, out-of-range
 * rating, unparseable date) are counted in `skipped` rather than thrown.
 */
export function reviewsFromCsvRows(rows: unknown[]): CsvImportResult {
  const reviews: Review[] = [];
  let skipped = 0;
  let counter = 1;

  for (const row of rows) {
    const result = csvReviewRowSchema.safeParse(row);
    if (!result.success) {
      skipped++;
      continue;
    }
    const date = new Date(result.data.date);
    if (Number.isNaN(date.getTime())) {
      skipped++;
      continue;
    }
    reviews.push({
      id: `r${counter++}`,
      text: result.data.text,
      rating: result.data.rating,
      date: date.toISOString(),
    });
  }

  return { reviews, skipped };
}
