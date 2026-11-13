import type { Review, ThemeCandidate, Theme } from "../types";

export const THEME_TYPE_LIST =
  "bug, feature_request, ux, pricing, delivery, support, quality, praise, other";

function formatReviewsForPrompt(reviews: Review[]): string {
  return reviews
    .map((r) => `[${r.id}] (${r.rating}★, ${r.date.slice(0, 10)}) ${r.text.replace(/\s+/g, " ").slice(0, 500)}`)
    .join("\n");
}

export function buildThemeBatchPrompt(reviews: Review[], appName: string) {
  const system = `You are a product analyst who reads Google Play Store reviews for "${appName}" and groups them into themes. You only use the review text given to you -- never invent quotes or facts. Respond with ONLY valid JSON, no prose, no markdown fences.`;

  const prompt = `Group the following ${reviews.length} reviews into 3-8 themes.

Each theme must have:
- "name": short theme name (max 8 words)
- "description": 1-2 sentence description of the theme
- "type": one of [${THEME_TYPE_LIST}]
- "sentiment": number from -1 (very negative) to 1 (very positive)
- "review_ids": array of review IDs (from the bracketed [rN] tags below) that belong to this theme
- "representative_review_ids": 2-4 of those review_ids that best represent the theme (pick ones with clear, quotable text)

Rules:
- Every review_id you use MUST come from the list below. Do not invent IDs.
- A review can belong to more than one theme if it genuinely raises multiple issues.
- Prefer fewer, clearer themes over many overlapping ones.
- Praise-only reviews should go in a "praise" type theme, not be scattered across others.

Reviews:
${formatReviewsForPrompt(reviews)}

Respond with ONLY this JSON shape:
{"themes": [{"name": "...", "description": "...", "type": "...", "sentiment": 0, "review_ids": ["r1"], "representative_review_ids": ["r1"]}]}`;

  return { system, prompt };
}

export function buildMergePrompt(candidates: ThemeCandidate[], appName: string) {
  const system = `You are a senior PM at "${appName}" who consolidates draft review themes into a final roadmap-ready list. Respond with ONLY valid JSON, no prose, no markdown fences.`;

  const candidateList = candidates
    .map(
      (c, idx) =>
        `[${idx}] "${c.name}" (type=${c.type}, sentiment=${c.sentiment}, ${c.review_ids.length} reviews) -- ${c.description}`,
    )
    .join("\n");

  const prompt = `Below are ${candidates.length} draft theme candidates produced from separate batches of reviews. Many are duplicates or near-duplicates of each other (same underlying issue, different wording). Consolidate them into 6-10 final themes.

For each final theme, return:
- "name": short final name
- "description": 1-2 sentence description
- "type": one of [${THEME_TYPE_LIST}]
- "candidate_indices": the indices (from the list below) of every draft candidate that belongs in this final theme (merge duplicates together)
- "impact": your estimate of business impact on a 1-3 scale (3 = high impact)
- "effort": your estimate of engineering/product effort to address this on a 1-5 scale (5 = very high effort)
- "impact_rationale": one sentence explaining the impact estimate
- "effort_rationale": one sentence explaining the effort estimate
- "merge_rationale": (optional) one sentence if you merged 2+ candidates, explaining why they're the same theme

Rules:
- Every candidate_indices value MUST be an index from the list below (0-based). Do not invent indices.
- Each candidate index should be used in AT MOST one final theme -- don't split one candidate across two themes.
- You do not need to use every candidate; if one is truly its own thing and minor, you may leave it out.
- Keep review counting out of scope -- you only decide groupings and impact/effort, not final counts.
- Praise themes should keep type "praise" and typically get impact 1.

Draft candidates:
${candidateList}

Respond with ONLY this JSON shape:
{"themes": [{"name": "...", "description": "...", "type": "...", "candidate_indices": [0,1], "impact": 2, "effort": 3, "impact_rationale": "...", "effort_rationale": "...", "merge_rationale": "..."}]}`;

  return { system, prompt };
}

export function buildPrdPrompt(args: {
  theme: Theme;
  quotes: { id: string; text: string; rating: number }[];
  totalReviews: number;
  oneStarCount: number;
  avgRating: number;
  appName: string;
}) {
  const { theme, quotes, totalReviews, oneStarCount, avgRating, appName } = args;
  const system = `You are a product manager at "${appName}" writing a crisp, one-page PRD for an internal roadmap review. Use ONLY the real counts and quotes given to you -- never invent a quote or a number that wasn't provided. Mark anything you can't know (like user segments or qualitative causes) with "[TODO: ...]" rather than guessing. Respond with ONLY valid JSON, no prose, no markdown fences.`;

  const quoteBlock = quotes.map((q) => `- (${q.rating}★) "${q.text}"`).join("\n");

  const prompt = `Write a one-page PRD in Markdown for this theme:

Theme: ${theme.name}
Type: ${theme.type}
Description: ${theme.description}
Mentioned in: ${theme.review_ids.length} of ${totalReviews} analysed reviews
1-star mentions of this theme: at most ${oneStarCount} (overall 1-star count across the whole review set, use only if relevant)
Overall average rating across the dataset: ${avgRating.toFixed(2)}
RICE score: ${theme.score} (reach ${theme.reach}/10, impact ${theme.impact}/3, confidence ${theme.confidence}%, effort ${theme.effort}/5)

Real review quotes for this theme (use these verbatim where you quote -- do not alter wording):
${quoteBlock}

The Markdown must have exactly these ## sections, in this order: Problem, Evidence, Users affected, Goals & success metrics, Non-goals, Proposed solution, Risks, Open questions.
"Goals & success metrics" must include a primary, secondary, and guardrail metric, each with a concrete numeric target.
"Evidence" must cite the real counts above and include at least 2 of the real quotes verbatim (with quotation marks).

Respond with ONLY this JSON shape:
{"markdown": "# PRD: ...\\n\\n## Problem\\n..."}`;

  return { system, prompt };
}
