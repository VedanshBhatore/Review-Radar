import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { riceUpdateRequestSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; themeId: string }> },
) {
  try {
    const { id, themeId } = await params;
    const patch = riceUpdateRequestSchema.parse(await request.json());

    const theme = await getStore().updateThemeRice(id, themeId, patch);
    if (!theme) {
      return NextResponse.json(
        { error: "That report or theme doesn't exist.", reason: "not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ theme });
  } catch (error) {
    return errorResponse(error);
  }
}
