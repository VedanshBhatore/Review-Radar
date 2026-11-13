import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { classifyProviderError } from "./errors";

export type ModelTier = "fast" | "smart";

export interface CompletionArgs {
  system: string;
  prompt: string;
  tier: ModelTier;
}

export interface CompletionProvider {
  name: "claude" | "gemini";
  fastModel: string;
  smartModel: string;
  complete(args: CompletionArgs): Promise<string>;
}

const MAX_OUTPUT_TOKENS = 4096;

export function createClaudeProvider(apiKey: string): CompletionProvider {
  const client = new Anthropic({ apiKey });
  const fastModel = process.env.CLAUDE_FAST_MODEL || "claude-haiku-5-5";
  const smartModel = process.env.CLAUDE_SMART_MODEL || "claude-sonnet-5-5";

  return {
    name: "claude",
    fastModel,
    smartModel,
    async complete({ system, prompt, tier }) {
      try {
        const message = await client.messages.create({
          model: tier === "fast" ? fastModel : smartModel,
          max_tokens: MAX_OUTPUT_TOKENS,
          system,
          messages: [{ role: "user", content: prompt }],
        });
        const textBlock = message.content.find((block) => block.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          throw new Error("Claude response contained no text content");
        }
        return textBlock.text;
      } catch (error) {
        throw classifyProviderError(error);
      }
    },
  };
}

export function createGeminiProvider(apiKey: string): CompletionProvider {
  const client = new GoogleGenAI({ apiKey });
  const fastModel = process.env.GEMINI_FAST_MODEL || "gemini-3.8-flash";
  const smartModel = process.env.GEMINI_SMART_MODEL || "gemini-3.8-flash";

  return {
    name: "gemini",
    fastModel,
    smartModel,
    async complete({ system, prompt, tier }) {
      try {
        const response = await client.models.generateContent({
          model: tier === "fast" ? fastModel : smartModel,
          contents: prompt,
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
          },
        });
        const text = response.text;
        if (!text) {
          throw new Error("Gemini response contained no text content");
        }
        return text;
      } catch (error) {
        throw classifyProviderError(error);
      }
    },
  };
}
