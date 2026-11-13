import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { mergeThemeCandidates } from "@/lib/llm";
import { buildFinalThemes } from "@/lib/merge";
import { themesMergeRequestSchema } from "@/lib/schemas";
import { sortThemesByRank } from "@/lib/rice";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { candidates, reviews, appName } = themesMergeRequestSchema.parse(await request.json());

    const groups = await mergeThemeCandidates(candidates, appName);
    const themes = buildFinalThemes(candidates, groups, reviews);

    return NextResponse.json({ themes: sortThemesByRank(themes) });
  } catch (error) {
    return errorResponse(error);
  }
}
