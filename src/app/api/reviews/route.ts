import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { reviewsRequestSchema } from "@/lib/schemas";
import { fetchAppMeta, fetchReviews, parseAppId } from "@/lib/scraper";
import { getStore } from "@/lib/store";
import type { ReviewsCache } from "@/lib/types";

export const dynamic = "force-dynamic";

const CACHE_TTL_HOURS = 24;
const RECENT_REPORT_WINDOW_HOURS = 24;
const MAX_REVIEWS = 500;

export async function POST(request: Request) {
  try {
    const body = reviewsRequestSchema.parse(await request.json());
    const appId = parseAppId(body.input);
    const store = getStore();

    if (!body.force) {
      const recentReport = await store.findRecentReportForApp(appId, RECENT_REPORT_WINDOW_HOURS);
      if (recentReport) {
        return NextResponse.json({
          status: "existing_report" as const,
          reportId: recentReport.id,
          createdAt: recentReport.createdAt,
          appName: recentReport.app.appName,
        });
      }
    }

    const cached = await store.getReviewsCache(appId);
    const isFresh = cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_HOURS * 60 * 60 * 1000;

    if (isFresh && cached) {
      return NextResponse.json({
        status: "ok" as const,
        app: cached.app,
        reviews: cached.reviews,
        fromCache: true,
      });
    }

    const app = await fetchAppMeta(appId);
    const reviews = await fetchReviews(appId, MAX_REVIEWS);

    const reviewsCache: ReviewsCache = {
      appId,
      app,
      reviews,
      fetchedAt: new Date().toISOString(),
    };
    await store.saveReviewsCache(reviewsCache);

    return NextResponse.json({
      status: "ok" as const,
      app,
      reviews,
      fromCache: false,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
