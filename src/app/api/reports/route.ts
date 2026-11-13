import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { getActiveProviderInfo } from "@/lib/llm";
import { createReportRequestSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";
import type { Report } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { app, reviews, themes, isDemo } = createReportRequestSchema.parse(await request.json());

    const report: Report = {
      id: nanoid(10),
      app,
      reviews,
      themes,
      provider: getActiveProviderInfo(),
      createdAt: new Date().toISOString(),
      isDemo: isDemo ?? false,
      prds: {},
      feedback: [],
    };

    await getStore().createReport(report);

    return NextResponse.json({ id: report.id, provider: report.provider.provider });
  } catch (error) {
    return errorResponse(error);
  }
}
