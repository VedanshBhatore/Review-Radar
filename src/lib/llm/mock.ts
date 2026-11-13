import type { Review, ThemeCandidate, ThemeType } from "../types";
import type { MergeGroupInput } from "../merge";

interface KeywordRule {
  type: ThemeType;
  keywords: string[];
  name: string;
  description: string;
  effort: number;
}

// Order matters: first matching rule wins. Praise is checked after the
// negative/functional buckets so a review that both complains and says
// "but I still love the app" lands in the complaint bucket, which is more
// actionable.
const RULES: KeywordRule[] = [
  {
    type: "bug",
    keywords: ["crash", "bug", "freeze", "frozen", "glitch", "error", "not working", "doesn't work", "stopped working", "force close"],
    name: "App crashes and bugs",
    description: "Users report the app crashing, freezing, or behaving unpredictably.",
    effort: 3,
  },
  {
    type: "delivery",
    keywords: ["late delivery", "delivery was late", "delivery was very late", "delivery was delayed", "delayed delivery", "delivery delay", "arrived late", "never arrived", "didn't arrive", "slow delivery", "out for delivery", "took forever to arrive", "past the slot", "hours late", "hours past", "was delayed", "pushed back", "delivery slot"],
    name: "Delivery delays",
    description: "Reviewers describe late, delayed, or failed deliveries.",
    effort: 3,
  },
  {
    type: "pricing",
    keywords: ["expensive", "price", "pricing", "overpriced", "too costly", "subscription", "hidden charge", "hidden fee", "hidden delivery charge", "surge"],
    name: "Pricing concerns",
    description: "Reviewers find pricing, fees, or subscription costs unreasonable.",
    effort: 2,
  },
  {
    type: "support",
    keywords: ["customer service", "customer support", "no response", "refund", "support team", "helpline", "never responded", "support chat", "unhelpful", "rude when i asked"],
    name: "Customer support issues",
    description: "Users describe unresponsive or unhelpful customer support, including refund problems.",
    effort: 2,
  },
  {
    type: "quality",
    keywords: ["damaged", "expired", "wrong item", "fake", "poor quality", "rotten", "stale", "spoiled", "defective"],
    name: "Product quality issues",
    description: "Reviewers received damaged, expired, incorrect, or low-quality items.",
    effort: 3,
  },
  {
    type: "ux",
    keywords: ["confusing", "hard to use", "navigate", "ui ", "interface", "layout", "redesign", "hard to find", "clunky"],
    name: "Confusing navigation and UI",
    description: "Users find the app's navigation or interface confusing or clunky.",
    effort: 2,
  },
  {
    type: "feature_request",
    keywords: ["wish", "please add", "would be nice", "feature request", "add an option", "please add", "i want", "add a", "missing feature"],
    name: "Feature requests",
    description: "Users are asking for specific missing functionality.",
    effort: 4,
  },
  {
    type: "praise",
    keywords: ["love this app", "love the app", "great app", "awesome", "excellent", "best app", "amazing", "superb", "fantastic", "very useful", "highly recommend"],
    name: "Positive feedback",
    description: "Reviewers are happy with the app overall.",
    effort: 1,
  },
];

function classify(review: Review): ThemeType {
  const text = review.text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.type;
  }
  // Fall back to rating-driven classification so every review lands somewhere sensible.
  // Deliberately does NOT guess a specific negative-feedback type (bug/quality/etc) for
  // an unmatched low rating -- that would mislabel things like unmatched support/delivery
  // complaints. "other" is the honest catch-all; only a clearly positive rating is confident
  // enough to bucket without a keyword match.
  if (review.rating >= 4) return "praise";
  return "other";
}

function ratingToSentiment(rating: number): number {
  return Math.round((((rating - 3) / 2) * 100)) / 100;
}

function pickRepresentatives(reviews: Review[], type: ThemeType, limit = 3): string[] {
  const sorted = [...reviews].sort((a, b) =>
    type === "praise" ? b.rating - a.rating : a.rating - b.rating,
  );
  return sorted.slice(0, limit).map((r) => r.id);
}

/**
 * Deterministic, offline, keyword-based clustering used when LLM_PROVIDER=mock
 * (or no API key is configured). Mirrors the shape the real providers return
 * (ThemeCandidate[]) so the rest of the pipeline is identical either way.
 */
export function mockThemeBatch(reviews: Review[]): ThemeCandidate[] {
  const groups = new Map<ThemeType, Review[]>();
  for (const review of reviews) {
    const type = classify(review);
    const list = groups.get(type);
    if (list) list.push(review);
    else groups.set(type, [review]);
  }

  const candidates: ThemeCandidate[] = [];
  const otherGroup = groups.get("other") ?? [];
  const sortedGroups = Array.from(groups.entries())
    .filter(([type]) => type !== "other")
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  for (const [type, groupReviews] of sortedGroups) {
    const rule = RULES.find((r) => r.type === type);
    const avgSentiment =
      groupReviews.reduce((sum, r) => sum + ratingToSentiment(r.rating), 0) / groupReviews.length;
    candidates.push({
      name: rule?.name ?? type,
      description: rule?.description ?? `Reviews related to ${type}.`,
      type,
      sentiment: Math.round(avgSentiment * 100) / 100,
      review_ids: groupReviews.map((r) => r.id),
      representative_review_ids: pickRepresentatives(groupReviews, type),
    });
  }

  if (candidates.length < 3 && otherGroup.length > 0) {
    candidates.push({
      name: "Other feedback",
      description: "Miscellaneous feedback that didn't fit a clearer bucket.",
      type: "other",
      sentiment:
        Math.round(
          (otherGroup.reduce((sum, r) => sum + ratingToSentiment(r.rating), 0) / otherGroup.length) * 100,
        ) / 100,
      review_ids: otherGroup.map((r) => r.id),
      representative_review_ids: pickRepresentatives(otherGroup, "other"),
    });
  }

  return candidates;
}

const IMPACT_BY_TYPE: Record<ThemeType, 1 | 2 | 3> = {
  bug: 3,
  delivery: 3,
  quality: 3,
  pricing: 2,
  support: 2,
  ux: 2,
  feature_request: 2,
  other: 1,
  praise: 1,
};

const EFFORT_BY_TYPE: Record<ThemeType, number> = {
  bug: 3,
  delivery: 3,
  quality: 3,
  pricing: 2,
  support: 2,
  ux: 2,
  feature_request: 4,
  other: 2,
  praise: 1,
};

/**
 * Mock "merge" step: groups batch candidates by theme type (a reasonable proxy for
 * "same underlying theme") and assigns impact/effort from a fixed heuristic table.
 * The actual review-ID union/dedup happens later in lib/merge.ts, identically for
 * every provider.
 */
export function mockMerge(candidates: ThemeCandidate[]): { themes: MergeGroupInput[] } {
  const byType = new Map<ThemeType, number[]>();
  candidates.forEach((candidate, idx) => {
    const list = byType.get(candidate.type);
    if (list) list.push(idx);
    else byType.set(candidate.type, [idx]);
  });

  const themes: MergeGroupInput[] = Array.from(byType.entries()).map(([type, indices]) => {
    const rule = RULES.find((r) => r.type === type);
    const totalMentions = indices.reduce((sum, idx) => sum + candidates[idx].review_ids.length, 0);
    return {
      name: rule?.name ?? (indices.length === 1 ? candidates[indices[0]].name : type),
      description: rule?.description ?? candidates[indices[0]].description,
      type,
      candidate_indices: indices,
      impact: IMPACT_BY_TYPE[type],
      effort: EFFORT_BY_TYPE[type],
      impact_rationale: `Mock heuristic: ${type.replace("_", " ")} themes default to impact ${IMPACT_BY_TYPE[type]}/3, based on ${totalMentions} mentions across ${indices.length} batch(es).`,
      effort_rationale: `Mock heuristic: ${type.replace("_", " ")} work defaults to effort ${EFFORT_BY_TYPE[type]}/5.`,
      merge_rationale:
        indices.length > 1
          ? `Combined ${indices.length} batch candidates that share the "${type}" theme type.`
          : undefined,
    };
  });

  return { themes: themes.slice(0, 10) };
}

const PRD_TEMPLATE_NOTES: Record<ThemeType, string> = {
  bug: "Stabilize the affected flow and add regression coverage before shipping further features in this area.",
  delivery: "Investigate the logistics/partner integration causing delays and tighten SLA monitoring.",
  pricing: "Revisit pricing transparency and communicate value more clearly at checkout.",
  support: "Add self-serve resolution paths and reduce first-response time for this issue category.",
  quality: "Tighten QA/vendor checks before items ship to reduce defect rate.",
  ux: "Run a quick usability pass on this flow; a redesign may not be needed if the fix is navigational.",
  feature_request: "Validate demand with a small cohort before committing full engineering effort.",
  other: "Triage further; this bucket is a catch-all and may hide more specific sub-themes.",
  praise: "Protect this strength when making changes elsewhere; consider highlighting it in marketing.",
};

export function mockPrdMarkdown(args: {
  appName: string;
  themeName: string;
  themeType: ThemeType;
  description: string;
  mentionCount: number;
  totalReviews: number;
  oneStarCount: number;
  avgRating: number;
  quotes: { text: string; rating: number }[];
}): string {
  const { appName, themeName, themeType, description, mentionCount, totalReviews, oneStarCount, avgRating, quotes } = args;
  const sharePct = totalReviews > 0 ? Math.round((mentionCount / totalReviews) * 1000) / 10 : 0;
  const quoteLines = quotes
    .slice(0, 5)
    .map((q) => `> "${q.text.trim()}" — ${q.rating}★`)
    .join("\n\n");

  return `# PRD: ${themeName}

## Problem
${description} This theme was mentioned in ${mentionCount} of ${totalReviews} analysed reviews (${sharePct}%) for ${appName}.

## Evidence
- ${mentionCount} reviews mention this theme (${sharePct}% of all analysed reviews).
- ${oneStarCount} of those mentions were 1-star reviews.
- Average rating across all analysed reviews: ${avgRating.toFixed(2)} / 5.

Representative quotes:

${quoteLines || "> No representative quotes were available for this theme."}

## Users affected
An estimated ${sharePct}% of reviewers raised this theme, skewing toward [TODO: segment, e.g. new vs. returning users -- not derivable from review text alone].

## Goals & success metrics
- **Primary:** Reduce mentions of "${themeName}" in reviews by 50% within 2 release cycles (target: from ${mentionCount} to ${Math.round(mentionCount / 2)} mentions per ${totalReviews}-review sample).
- **Secondary:** Improve average rating among affected users from ${avgRating.toFixed(2)} toward 4.5+.
- **Guardrail:** Overall app rating and 1-star share must not regress during the fix (baseline 1-star count: ${oneStarCount}).

## Non-goals
- This PRD does not address other themes surfaced in the same report.
- No UI-wide redesign is proposed unless the root cause is proven to be systemic.

## Proposed solution
${PRD_TEMPLATE_NOTES[themeType]}

## Risks
- Fix may not address root cause if the keyword signal mixes multiple underlying issues.
- Mention counts are self-reported review language, not instrumented telemetry -- validate with logs/analytics before committing engineering time.

## Open questions
- [TODO: confirm with support/CX data] Does this match ticket volume for the same period?
- [TODO] Is this theme concentrated in a specific app version, device, or region?

---
*Generated in demo mode (mock provider) from real review counts and quotes above -- no network call was made.*
`;
}
