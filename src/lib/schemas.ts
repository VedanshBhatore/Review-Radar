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

// --- API request/response payloads --------------------------------------

export const reviewSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  rating: z.number().int().min(1).max(5),
  date: z.string().min(1),
  userName: z.string().optional(),
});

export const appMetaSchema = z.object({
  appId: z.string().min(1),
  appName: z.string().min(1),
  icon: z.string().optional(),
  developer: z.string().optional(),
  score: z.number().optional(),
});

export const themeRationaleSchema = z.object({
  impact: z.string(),
  effort: z.string(),
  merge: z.string().optional(),
});

export const themeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  type: themeTypeSchema,
  sentiment: z.number().min(-1).max(1),
  review_ids: z.array(z.string()),
  representative_review_ids: z.array(z.string()),
  reach: z.number().int().min(1).max(10),
  impact: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  confidence: z.union([z.literal(50), z.literal(80), z.literal(100)]),
  effort: z.number().min(1).max(5),
  score: z.number(),
  rationale: themeRationaleSchema,
});

export const reviewsRequestSchema = z.object({
  input: z.string().min(1, "Enter a Play Store app ID or URL."),
  force: z.boolean().optional(),
});

export const themeBatchRequestSchema = z.object({
  reviews: z.array(reviewSchema).min(1),
  appName: z.string().min(1),
});

export const themesMergeRequestSchema = z.object({
  candidates: z.array(themeCandidateSchema).min(1),
  reviews: z.array(reviewSchema).min(1),
  appName: z.string().min(1),
});

export const createReportRequestSchema = z.object({
  app: appMetaSchema,
  reviews: z.array(reviewSchema).min(1),
  themes: z.array(themeSchema),
  isDemo: z.boolean().optional(),
});

export const generatePrdRequestSchema = z.object({
  themeId: z.string().min(1),
  regenerate: z.boolean().optional(),
});

export const feedbackRequestSchema = z.object({
  reportId: z.string().min(1),
  value: z.enum(["up", "down"]),
  comment: z.string().max(2000).optional(),
});

export const riceUpdateRequestSchema = z
  .object({
    impact: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    effort: z.number().min(1).max(5).optional(),
  })
  .refine((v) => v.impact !== undefined || v.effort !== undefined, {
    message: "Provide impact and/or effort to update.",
  });
