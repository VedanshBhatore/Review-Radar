import type { Review, Theme, ThemeCandidate, ThemeType } from "./types";
import { recomputeTheme } from "./rice";

export interface MergeGroupInput {
  name: string;
  description: string;
  type: ThemeType;
  candidate_indices: number[];
  impact: 1 | 2 | 3;
  effort: number;
  impact_rationale: string;
  effort_rationale: string;
  merge_rationale?: string;
}

const MAX_REPRESENTATIVE_IDS = 5;
const FORGOTTEN_CANDIDATE_MIN_REVIEWS = 3;
const FORGOTTEN_CANDIDATE_IMPACT = 2;
const FORGOTTEN_CANDIDATE_EFFORT = 2;

function weightedAverageSentiment(
  candidates: ThemeCandidate[],
  indices: number[],
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const idx of indices) {
    const candidate = candidates[idx];
    const weight = Math.max(candidate.review_ids.length, 1);
    weightedSum += candidate.sentiment * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Combines theme candidates (from the batch step) into final report themes using
 * the LLM's/mock's merge decisions (which candidate indices group together, plus
 * impact/effort). The union of review IDs happens here in code -- never trust the
 * model's own counts -- and every invariant the spec calls out is enforced:
 *   - invalid candidate indices are dropped
 *   - a candidate index used by an earlier group can't be reused by a later one
 *   - review/representative IDs that don't exist in the actual review set are dropped
 *   - any candidate the model "forgot" to place in a group is kept as its own theme
 *     if it still has 3+ (valid) reviews
 */
export function buildFinalThemes(
  candidates: ThemeCandidate[],
  groups: MergeGroupInput[],
  reviews: Review[],
): Theme[] {
  const validReviewIds = new Set(reviews.map((r) => r.id));
  const totalReviews = reviews.length;
  const usedCandidateIndices = new Set<number>();
  const themes: Theme[] = [];
  let nextId = 1;

  for (const group of groups) {
    const indices = Array.from(new Set(group.candidate_indices)).filter(
      (idx) =>
        Number.isInteger(idx) &&
        idx >= 0 &&
        idx < candidates.length &&
        !usedCandidateIndices.has(idx),
    );

    if (indices.length === 0) continue;
    for (const idx of indices) usedCandidateIndices.add(idx);

    const reviewIdSet = new Set<string>();
    const representativeIdSet = new Set<string>();
    for (const idx of indices) {
      const candidate = candidates[idx];
      for (const id of candidate.review_ids) {
        if (validReviewIds.has(id)) reviewIdSet.add(id);
      }
    }
    for (const idx of indices) {
      const candidate = candidates[idx];
      for (const id of candidate.representative_review_ids) {
        if (reviewIdSet.has(id) && representativeIdSet.size < MAX_REPRESENTATIVE_IDS) {
          representativeIdSet.add(id);
        }
      }
    }

    if (reviewIdSet.size === 0) continue;

    const theme: Theme = {
      id: `t${nextId++}`,
      name: group.name,
      description: group.description,
      type: group.type,
      sentiment: weightedAverageSentiment(candidates, indices),
      review_ids: Array.from(reviewIdSet),
      representative_review_ids: Array.from(representativeIdSet),
      reach: 1,
      impact: group.impact,
      confidence: 50,
      effort: group.effort,
      score: 0,
      rationale: {
        impact: group.impact_rationale,
        effort: group.effort_rationale,
        merge: group.merge_rationale,
      },
    };
    themes.push(recomputeTheme(theme, totalReviews));
  }

  candidates.forEach((candidate, idx) => {
    if (usedCandidateIndices.has(idx)) return;
    const reviewIds = candidate.review_ids.filter((id) => validReviewIds.has(id));
    if (reviewIds.length < FORGOTTEN_CANDIDATE_MIN_REVIEWS) return;

    const representativeIds = candidate.representative_review_ids
      .filter((id) => reviewIds.includes(id))
      .slice(0, MAX_REPRESENTATIVE_IDS);

    const theme: Theme = {
      id: `t${nextId++}`,
      name: candidate.name,
      description: candidate.description,
      type: candidate.type,
      sentiment: candidate.sentiment,
      review_ids: reviewIds,
      representative_review_ids: representativeIds,
      reach: 1,
      impact: FORGOTTEN_CANDIDATE_IMPACT,
      confidence: 50,
      effort: FORGOTTEN_CANDIDATE_EFFORT,
      score: 0,
      rationale: {
        impact: "Default estimate: this theme wasn't grouped during merging, so impact/effort weren't scored by the model.",
        effort: "Default estimate: this theme wasn't grouped during merging, so impact/effort weren't scored by the model.",
      },
    };
    themes.push(recomputeTheme(theme, totalReviews));
  });

  return themes;
}
