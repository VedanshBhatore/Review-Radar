import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { generateThemeBatch } from "@/lib/llm";
import { themeBatchRequestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { reviews, appName } = themeBatchRequestSchema.parse(await request.json());
    const validIds = new Set(reviews.map((r) => r.id));

    const candidates = await generateThemeBatch(reviews, appName);

    // Defensive filtering even at batch stage: never let an id the model invented
    // flow downstream, regardless of provider.
    const cleaned = candidates
      .map((candidate) => {
        const review_ids = candidate.review_ids.filter((id) => validIds.has(id));
        const keptIds = new Set(review_ids);
        return {
          ...candidate,
          review_ids,
          representative_review_ids: candidate.representative_review_ids.filter((id) =>
            keptIds.has(id),
          ),
        };
      })
      .filter((candidate) => candidate.review_ids.length > 0);

    return NextResponse.json({ themes: cleaned });
  } catch (error) {
    return errorResponse(error);
  }
}
