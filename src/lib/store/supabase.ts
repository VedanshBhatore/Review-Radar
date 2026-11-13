import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Report, ReviewsCache, Theme } from "../types";
import { recomputeTheme } from "../rice";
import type { Store } from "./types";

interface ReportRow {
  id: string;
  app_id: string;
  data: Report;
  created_at: string;
}

interface ReviewsCacheRow {
  app_id: string;
  data: ReviewsCache;
  fetched_at: string;
}

export function createSupabaseStore(url: string, serviceRoleKey: string): Store {
  const client: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return {
    async getReviewsCache(appId) {
      const { data, error } = await client
        .from("reviews_cache")
        .select("data")
        .eq("app_id", appId)
        .maybeSingle<Pick<ReviewsCacheRow, "data">>();
      if (error) throw error;
      return data?.data ?? null;
    },

    async saveReviewsCache(cache) {
      const { error } = await client.from("reviews_cache").upsert({
        app_id: cache.appId,
        data: cache,
        fetched_at: cache.fetchedAt,
      });
      if (error) throw error;
    },

    async createReport(report) {
      const { error } = await client.from("reports").insert({
        id: report.id,
        app_id: report.app.appId,
        data: report,
        created_at: report.createdAt,
      });
      if (error) throw error;
    },

    async getReport(id) {
      const { data, error } = await client
        .from("reports")
        .select("data")
        .eq("id", id)
        .maybeSingle<Pick<ReportRow, "data">>();
      if (error) throw error;
      return data?.data ?? null;
    },

    async findRecentReportForApp(appId, withinHours) {
      const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
      const { data, error } = await client
        .from("reports")
        .select("data")
        .eq("app_id", appId)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<Pick<ReportRow, "data">>();
      if (error) throw error;
      return data?.data ?? null;
    },

    async savePrd(reportId, themeId, prd) {
      const report = await this.getReport(reportId);
      if (!report) return null;
      report.prds[themeId] = prd;
      const { error } = await client.from("reports").update({ data: report }).eq("id", reportId);
      if (error) throw error;
      return report;
    },

    async saveFeedback(reportId, feedback) {
      const report = await this.getReport(reportId);
      if (!report) return null;
      report.feedback.push(feedback);
      const { error } = await client.from("reports").update({ data: report }).eq("id", reportId);
      if (error) throw error;
      return report;
    },

    async updateThemeRice(reportId, themeId, patch) {
      const report = await this.getReport(reportId);
      if (!report) return null;
      const theme = report.themes.find((t: Theme) => t.id === themeId);
      if (!theme) return null;
      if (patch.impact !== undefined) theme.impact = patch.impact as Theme["impact"];
      if (patch.effort !== undefined) theme.effort = patch.effort;
      Object.assign(theme, recomputeTheme(theme, report.reviews.length));
      const { error } = await client.from("reports").update({ data: report }).eq("id", reportId);
      if (error) throw error;
      return theme;
    },
  };
}
