export type LlmErrorReason =
  | "missing_api_key"
  | "rate_limited"
  | "invalid_api_key"
  | "provider_unreachable"
  | "invalid_response"
  | "unknown";

/**
 * A friendly, user-facing LLM error. `reason` is a stable machine-readable code
 * API routes can map to a specific toast/banner; `message` is already phrased
 * for the UI (what went wrong + how to fix it).
 */
export class LlmError extends Error {
  reason: LlmErrorReason;

  constructor(reason: LlmErrorReason, message: string) {
    super(message);
    this.name = "LlmError";
    this.reason = reason;
  }
}

export function classifyProviderError(error: unknown): LlmError {
  if (error instanceof LlmError) return error;

  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: number }).status
      : undefined;
  const message = error instanceof Error ? error.message : String(error);

  if (status === 401 || /api key|unauthorized|permission denied/i.test(message)) {
    return new LlmError(
      "invalid_api_key",
      "The configured LLM API key was rejected. Double-check ANTHROPIC_API_KEY / GEMINI_API_KEY in your .env.local.",
    );
  }
  if (status === 429 || /rate limit|quota/i.test(message)) {
    return new LlmError(
      "rate_limited",
      "The LLM provider is rate-limiting requests right now. Wait a minute and try again, or switch LLM_PROVIDER=mock to keep working offline.",
    );
  }
  if (status !== undefined && status >= 500) {
    return new LlmError(
      "provider_unreachable",
      "The LLM provider seems to be down. Try again shortly, or switch LLM_PROVIDER=mock to keep working offline.",
    );
  }
  if (/ENOTFOUND|ECONNREFUSED|fetch failed|network/i.test(message)) {
    return new LlmError(
      "provider_unreachable",
      "Couldn't reach the LLM provider -- check your network connection, or switch LLM_PROVIDER=mock to keep working offline.",
    );
  }
  return new LlmError("unknown", `LLM call failed: ${message}`);
}
