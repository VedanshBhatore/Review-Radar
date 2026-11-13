import { z } from "zod";
import { THEME_TYPES } from "./types";

export const themeTypeSchema = z.enum(THEME_TYPES);

export const themeCandidateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  type: themeTypeSchema,
  sentiment: z.number().min(-1).max(1),
  review_ids: z.array(z.string()).min(1),
  representative_review_ids: z.array(z.string()).min(1),
});

export const themeBatchResponseSchema = z.object({
  themes: z.array(themeCandidateSchema).min(1).max(8),
});

export type ThemeBatchResponse = z.infer<typeof themeBatchResponseSchema>;

export const mergeGroupSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(500),
  type: themeTypeSchema,
  candidate_indices: z.array(z.number().int().min(0)).min(1),
  impact: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  effort: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  impact_rationale: z.string().min(1).max(300),
  effort_rationale: z.string().min(1).max(300),
  merge_rationale: z.string().max(300).optional(),
});

export const mergeResponseSchema = z.object({
  themes: z.array(mergeGroupSchema).min(1).max(10),
});

export type MergeResponse = z.infer<typeof mergeResponseSchema>;
export type MergeGroup = z.infer<typeof mergeGroupSchema>;

export const prdResponseSchema = z.object({
  markdown: z.string().min(1),
});

export type PrdResponse = z.infer<typeof prdResponseSchema>;

export const csvReviewRowSchema = z.object({
  text: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  date: z.string().min(1),
});

export type CsvReviewRow = z.infer<typeof csvReviewRowSchema>;
