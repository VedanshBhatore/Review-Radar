"use client";

import posthog from "posthog-js";

let initialized = false;

/**
 * Initializes PostHog once, client-side only, and resolves the onboarding_variant
 * feature flag into a persistent super property so every subsequent event carries
 * it automatically (no need to pass it at every call site).
 */
export function initAnalytics() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    person_profiles: "identified_only",
    loaded: (ph) => {
      const flag = ph.getFeatureFlag("onboarding_variant");
      ph.register({ onboarding_variant: flag === "control" ? "control" : "test" });
    },
  });
  initialized = true;
}

function capture(event: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, props);
}

/**
 * The onboarding_variant A/B flag: "control" shows input only, "test" (default)
 * adds highlighted sample-app buttons. Falls back to "test" when PostHog isn't
 * configured at all, per spec.
 */
export function getOnboardingVariant(): "control" | "test" {
  if (!initialized) return "test";
  return posthog.getFeatureFlag("onboarding_variant") === "control" ? "control" : "test";
}

export function trackLandingViewed() {
  capture("landing_viewed");
}

export function trackSampleClicked(appId: string) {
  capture("sample_clicked", { app_id: appId });
}

export function trackDemoClicked() {
  capture("demo_clicked");
}

export function trackAnalysisStarted(props: { mode: string }) {
  capture("analysis_started", props);
}

export function trackAnalysisCompleted(props: {
  durationMs: number;
  reviewCount: number;
  provider?: string;
}) {
  capture("analysis_completed", {
    duration_ms: props.durationMs,
    review_count: props.reviewCount,
    provider: props.provider,
  });
}

export function trackAnalysisFailed(props: { reason: string }) {
  capture("analysis_failed", { reason: props.reason });
}

export function trackPrdGenerated(props: { themeId: string; themeType: string }) {
  capture("prd_generated", { theme_id: props.themeId, theme_type: props.themeType });
}

export function trackReportShared(props: { reportId: string }) {
  capture("report_shared", { report_id: props.reportId });
}

export function trackPdfExported(props: { reportId: string }) {
  capture("pdf_exported", { report_id: props.reportId });
}

export function trackRiceEdited(props: { themeId: string; field: "impact" | "effort"; value: number }) {
  capture("rice_edited", { theme_id: props.themeId, field: props.field, value: props.value });
}

export function trackFeedbackSubmitted(props: { value: "up" | "down" }) {
  capture("feedback_submitted", { value: props.value });
}
