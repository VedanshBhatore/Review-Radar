import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { generatePrd } from "@/lib/llm";
import { generatePrdRequestSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { themeId, regenerate } = generatePrdRequestSchema.parse(await request.json());

    const store = getStore();
    const report = await store.getReport(id);
    if (!report) {
      return NextResponse.json(
        { error: "That report doesn't exist (or the link is wrong).", reason: "not_found" },
        { status: 404 },
      );
    }

    if (!regenerate && report.prds[themeId]) {
      return NextResponse.json({ prd: report.prds[themeId] });
    }

    const theme = report.themes.find((t) => t.id === themeId);
    if (!theme) {
      return NextResponse.json(
        { error: "That theme doesn't exist on this report.", reason: "not_found" },
        { status: 404 },
      );
    }

    const reviewsById = new Map(report.reviews.map((r) => [r.id, r]));
    const quotes = theme.representative_review_ids
      .map((rid) => reviewsById.get(rid))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => ({ id: r.id, text: r.text, rating: r.rating }));

    const totalReviews = report.reviews.length;
    const avgRating =
      totalReviews > 0 ? report.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
    const oneStarCount = theme.review_ids.filter((rid) => reviewsById.get(rid)?.rating === 1).length;

    const prd = await generatePrd({
      theme,
      quotes,
      totalReviews,
      oneStarCount,
      avgRating,
      appName: report.app.appName,
    });

    const updated = await store.savePrd(id, themeId, prd);
    if (!updated) {
      return NextResponse.json(
        { error: "Couldn't save the PRD -- the report may have been deleted.", reason: "not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ prd });
  } catch (error) {
    return errorResponse(error);
  }
}
