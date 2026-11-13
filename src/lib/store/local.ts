import { promises as fs } from "fs";
import path from "path";
import type { Report, ReviewsCache, Theme } from "../types";
import { recomputeTheme } from "../rice";
import type { Store } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const REVIEWS_CACHE_DIR = path.join(DATA_DIR, "reviews-cache");
const REPORTS_DIR = path.join(DATA_DIR, "reports");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function sanitizeAppId(appId: string): string {
  return appId.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function createLocalStore(): Store {
  return {
    async getReviewsCache(appId) {
      return readJson<ReviewsCache>(path.join(REVIEWS_CACHE_DIR, `${sanitizeAppId(appId)}.json`));
    },

    async saveReviewsCache(cache) {
      await writeJson(path.join(REVIEWS_CACHE_DIR, `${sanitizeAppId(cache.appId)}.json`), cache);
    },

    async createReport(report) {
      await writeJson(path.join(REPORTS_DIR, `${report.id}.json`), report);
    },

    async getReport(id) {
      return readJson<Report>(path.join(REPORTS_DIR, `${id}.json`));
    },

    async findRecentReportForApp(appId, withinHours) {
      await ensureDir(REPORTS_DIR);
      const files = await fs.readdir(REPORTS_DIR);
      const cutoff = Date.now() - withinHours * 60 * 60 * 1000;

      let mostRecent: Report | null = null;
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const report = await readJson<Report>(path.join(REPORTS_DIR, file));
        if (!report || report.app.appId !== appId) continue;
        if (new Date(report.createdAt).getTime() < cutoff) continue;
        if (!mostRecent || new Date(report.createdAt) > new Date(mostRecent.createdAt)) {
          mostRecent = report;
        }
      }
      return mostRecent;
    },

    async savePrd(reportId, themeId, prd) {
      const report = await readJson<Report>(path.join(REPORTS_DIR, `${reportId}.json`));
      if (!report) return null;
      report.prds[themeId] = prd;
      await writeJson(path.join(REPORTS_DIR, `${reportId}.json`), report);
      return report;
    },

    async saveFeedback(reportId, feedback) {
      const report = await readJson<Report>(path.join(REPORTS_DIR, `${reportId}.json`));
      if (!report) return null;
      report.feedback.push(feedback);
      await writeJson(path.join(REPORTS_DIR, `${reportId}.json`), report);
      return report;
    },

    async updateThemeRice(reportId, themeId, patch) {
      const report = await readJson<Report>(path.join(REPORTS_DIR, `${reportId}.json`));
      if (!report) return null;
      const theme = report.themes.find((t: Theme) => t.id === themeId);
      if (!theme) return null;
      if (patch.impact !== undefined) theme.impact = patch.impact as Theme["impact"];
      if (patch.effort !== undefined) theme.effort = patch.effort;
      const recomputed = recomputeTheme(theme, report.reviews.length);
      Object.assign(theme, recomputed);
      await writeJson(path.join(REPORTS_DIR, `${reportId}.json`), report);
      return theme;
    },
  };
}
