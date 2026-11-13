import type { z } from "zod";
import type { LlmModelInfo, PrdContent, Review, Theme, ThemeCandidate } from "./types";
import type { MergeGroupInput } from "./merge";
import { mergeResponseSchema, prdResponseSchema, themeBatchResponseSchema } from "./schemas";
import { parseJsonLoose } from "./json";
import { mockMerge, mockPrdMarkdown, mockThemeBatch } from "./llm/mock";
import { buildMergePrompt, buildPrdPrompt, buildThemeBatchPrompt } from "./llm/prompts";
import { createClaudeProvider, createGeminiProvider, type CompletionProvider, type ModelTier } from "./llm/providers";
import { LlmError } from "./llm/errors";

export type { LlmErrorReason } from "./llm/errors";
export { LlmError } from "./llm/errors";

type ProviderName = "claude" | "gemini" | "mock";

function resolveProviderName(): ProviderName {
  const configured = process.env.LLM_PROVIDER?.toLowerCase();
  if (configured === "claude" || configured === "gemini" || configured === "mock") {
    return configured;
  }
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

let cachedProvider: CompletionProvider | null | undefined;

function getCompletionProvider(): CompletionProvider | null {
  if (cachedProvider !== undefined) return cachedProvider;

  const name = resolveProviderName();
  if (name === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new LlmError(
        "missing_api_key",
        "LLM_PROVIDER=claude is set but ANTHROPIC_API_KEY is missing. Add it to .env.local, or set LLM_PROVIDER=mock to run offline.",
      );
    }
    cachedProvider = createClaudeProvider(apiKey);
  } else if (name === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new LlmError(
        "missing_api_key",
        "LLM_PROVIDER=gemini is set but GEMINI_API_KEY is missing. Add it to .env.local, or set LLM_PROVIDER=mock to run offline.",
      );
    }
    cachedProvider = createGeminiProvider(apiKey);
  } else {
    cachedProvider = null;
  }
  return cachedProvider;
}

export function getActiveProviderName(): ProviderName {
  return resolveProviderName();
}

export function isDemoMode(): boolean {
  return resolveProviderName() === "mock";
}

export function getActiveProviderInfo(): LlmModelInfo {
  const name = resolveProviderName();
  if (name === "mock") {
    return { provider: "mock", fastModel: "mock-keyword-clusterer", smartModel: "mock-keyword-clusterer" };
  }
  const provider = getCompletionProvider();
  return {
    provider: name,
    fastModel: provider?.fastModel ?? "unknown",
    smartModel: provider?.smartModel ?? "unknown",
  };
}

const MAX_ATTEMPTS = 2;

async function completeAndValidateJson<T>(
  provider: CompletionProvider,
  tier: ModelTier,
  system: string,
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T> {
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const effectivePrompt =
      attempt === 1
        ? prompt
        : `${prompt}\n\nYour previous response was invalid. Error: ${lastError}\n\nRespond again with ONLY corrected valid JSON in the exact shape requested -- no prose, no markdown fences.`;

    const raw = await provider.complete({ system, prompt: effectivePrompt, tier });

    try {
      const parsed = parseJsonLoose(raw);
      const result = schema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new LlmError(
    "invalid_response",
    `The ${provider.name} model returned invalid JSON even after a retry. Last error: ${lastError}`,
  );
}

export async function generateThemeBatch(reviews: Review[], appName: string): Promise<ThemeCandidate[]> {
  const provider = getCompletionProvider();
  if (!provider) return mockThemeBatch(reviews);

  const { system, prompt } = buildThemeBatchPrompt(reviews, appName);
  const result = await completeAndValidateJson(provider, "fast", system, prompt, themeBatchResponseSchema);
  return result.themes;
}

export async function mergeThemeCandidates(
  candidates: ThemeCandidate[],
  appName: string,
): Promise<MergeGroupInput[]> {
  const provider = getCompletionProvider();
  if (!provider) return mockMerge(candidates).themes;

  const { system, prompt } = buildMergePrompt(candidates, appName);
  const result = await completeAndValidateJson(provider, "smart", system, prompt, mergeResponseSchema);
  return result.themes as MergeGroupInput[];
}

export interface PrdGenerationArgs {
  theme: Theme;
  quotes: { id: string; text: string; rating: number }[];
  totalReviews: number;
  oneStarCount: number;
  avgRating: number;
  appName: string;
}

export async function generatePrd(args: PrdGenerationArgs): Promise<PrdContent> {
  const provider = getCompletionProvider();
  const generatedAt = new Date().toISOString();

  if (!provider) {
    const markdown = mockPrdMarkdown({
      appName: args.appName,
      themeName: args.theme.name,
      themeType: args.theme.type,
      description: args.theme.description,
      mentionCount: args.theme.review_ids.length,
      totalReviews: args.totalReviews,
      oneStarCount: args.oneStarCount,
      avgRating: args.avgRating,
      quotes: args.quotes,
    });
    return { markdown, generatedAt, model: "mock-template" };
  }

  const { system, prompt } = buildPrdPrompt(args);
  const result = await completeAndValidateJson(provider, "smart", system, prompt, prdResponseSchema);
  return { markdown: result.markdown, generatedAt, model: provider.smartModel };
}
