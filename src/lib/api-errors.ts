import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { LlmError } from "./llm";
import { ScraperError } from "./scraper";

const LLM_ERROR_STATUS: Record<string, number> = {
  missing_api_key: 500,
  invalid_api_key: 401,
  rate_limited: 429,
  provider_unreachable: 502,
  invalid_response: 502,
  unknown: 500,
};

const SCRAPER_ERROR_STATUS: Record<string, number> = {
  invalid_app_id: 400,
  unreachable: 502,
};

/**
 * Converts any error thrown inside an API route into a friendly JSON response:
 * what went wrong, and (via `reason`) enough for the client to suggest a fix.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof LlmError) {
    return NextResponse.json(
      { error: error.message, reason: error.reason },
      { status: LLM_ERROR_STATUS[error.reason] ?? 500 },
    );
  }
  if (error instanceof ScraperError) {
    return NextResponse.json(
      { error: error.message, reason: error.reason },
      { status: SCRAPER_ERROR_STATUS[error.reason] ?? 502 },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "The request body didn't match the expected shape.",
        reason: "invalid_request",
        details: error.issues,
      },
      { status: 400 },
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "The request body wasn't valid JSON.", reason: "invalid_request" },
      { status: 400 },
    );
  }

  console.error(error);
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return NextResponse.json(
    { error: `Unexpected error: ${message}`, reason: "unknown" },
    { status: 500 },
  );
}
