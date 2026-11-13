import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { feedbackRequestSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";
import type { FeedbackEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { reportId, value, comment } = feedbackRequestSchema.parse(await request.json());

    const entry: FeedbackEntry = {
      id: nanoid(10),
      value,
      comment,
      createdAt: new Date().toISOString(),
    };

    const updated = await getStore().saveFeedback(reportId, entry);
    if (!updated) {
      return NextResponse.json(
        { error: "That report doesn't exist.", reason: "not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
