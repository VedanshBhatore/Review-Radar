import gplay from "google-play-scraper";
import type { AppMeta, Review } from "./types";

// google-play-scraper's own .d.ts declares `sort` as the *enum value type* rather
// than the enum namespace, so `gplay.sort.NEWEST` is a real runtime value but a
// TypeScript error if referenced directly. Reach for it through an `unknown` cast
// instead of fighting the (incorrect) upstream types.
const PLAY_SORT = gplay.sort as unknown as { NEWEST: number; RATING: number; HELPFULNESS: number };

const PAGE_SIZE = 150;
const MAX_REVIEWS = 500;
const PAGE_PAUSE_MS = 300;

export class ScraperError extends Error {
  reason: "invalid_app_id" | "unreachable";
  constructor(reason: "invalid_app_id" | "unreachable", message: string) {
    super(message);
    this.name = "ScraperError";
    this.reason = reason;
  }
}

/**
 * Accepts either a bare Play Store package id (e.g. "com.grofers.customerapp")
 * or a full Play Store URL and returns the bare package id.
 */
export function parseAppId(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    const id = url.searchParams.get("id");
    if (id) return id;
  } catch {
    // not a URL, fall through to treat it as a raw package id
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(trimmed)) {
    throw new ScraperError(
      "invalid_app_id",
      `"${input}" doesn't look like a Play Store app ID or URL. Try something like "com.grofers.customerapp" or paste the full Play Store link.`,
    );
  }
  return trimmed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAppMeta(appId: string): Promise<AppMeta> {
  try {
    const app = await gplay.app({ appId, lang: "en", country: "in" });
    return {
      appId,
      appName: app.title,
      icon: app.icon,
      developer: app.developer,
      score: app.score,
    };
  } catch {
    throw new ScraperError(
      "invalid_app_id",
      `Couldn't find "${appId}" on the Play Store. Double-check the app ID (e.g. "com.grofers.customerapp") -- it's case-sensitive and must be the exact package name.`,
    );
  }
}

/**
 * Fetches up to `maxReviews` of the newest reviews for an app, paginating with a
 * short pause between pages to avoid hammering the Play Store, and assigns short
 * IDs (r1, r2, ...) that keep downstream LLM prompts compact.
 */
export async function fetchReviews(
  appId: string,
  maxReviews: number = MAX_REVIEWS,
  onPage?: (fetchedSoFar: number) => void,
): Promise<Review[]> {
  const reviews: Review[] = [];
  let token: string | undefined;
  let counter = 1;

  try {
    do {
      const result = await gplay.reviews({
        appId,
        lang: "en",
        country: "in",
        num: PAGE_SIZE,
        paginate: true,
        sort: PLAY_SORT.NEWEST as never,
        ...(token ? { nextPaginationToken: token } : {}),
      });

      for (const item of result.data) {
        if (reviews.length >= maxReviews) break;
        reviews.push({
          id: `r${counter++}`,
          text: item.text ?? "",
          rating: item.score,
          date: item.date,
          userName: item.userName,
        });
      }

      onPage?.(reviews.length);
      token = result.nextPaginationToken;

      if (token && reviews.length < maxReviews) {
        await sleep(PAGE_PAUSE_MS);
      }
    } while (token && reviews.length < maxReviews);
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    throw new ScraperError(
      "unreachable",
      "Couldn't reach the Play Store right now. Check your network connection and try again in a moment.",
    );
  }

  return reviews;
}
