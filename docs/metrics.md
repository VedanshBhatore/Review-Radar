# Metrics

Every event name and property below is implemented exactly as written in
[`src/lib/analytics.ts`](../src/lib/analytics.ts) and called from the sites listed. If
`NEXT_PUBLIC_POSTHOG_KEY` isn't set, every call below silently no-ops — no events fire,
nothing breaks.

## North Star metric

**Reports generated per week** — count of `analysis_completed` events per week.

Why this over, say, `landing_viewed` or `analysis_started`: a completed report is the
point where ReviewRadar has actually delivered its core value (themes + RICE scores for
a real or demo app). Counting started-but-abandoned analyses would reward a broken
pipeline that looks busy; counting pageviews would reward marketing, not product value.

## Activation funnel

```
landing_viewed → analysis_started → analysis_completed → prd_generated
```

Build this as a PostHog Funnel insight using these four events in order, no filters
needed beyond the event names themselves. Interpretation:

| Step | What a drop here means |
|---|---|
| `landing_viewed` → `analysis_started` | The pitch doesn't convince people to try it (copy/trust problem), or the input UX is confusing. |
| `analysis_started` → `analysis_completed` | The pipeline itself is failing or timing out — look at `analysis_failed` reasons first. |
| `analysis_completed` → `prd_generated` | People get a report but don't trust/need a PRD from it — the report itself may already feel sufficient, or themes don't feel actionable. |

## Input metrics (drive the North Star)

| Metric | Event(s) | Properties |
|---|---|---|
| Landing page views | `landing_viewed` | — |
| Sample-app clicks | `sample_clicked` | `app_id` |
| Demo clicks | `demo_clicked` | — |
| Analyses started | `analysis_started` | `mode` (`playstore` \| `demo` \| `csv`) |
| Analyses completed | `analysis_completed` | `duration_ms`, `review_count`, `provider` (`claude`\|`gemini`\|`mock`) |
| PRDs generated | `prd_generated` | `theme_id`, `theme_type` |
| Reports shared | `report_shared` | `report_id` |
| PDFs exported | `pdf_exported` | `report_id` |
| RICE edits made | `rice_edited` | `theme_id`, `field` (`impact`\|`effort`), `value` |

## Guardrails (should NOT move in the wrong direction as the above grows)

| Guardrail | Event | Watch for |
|---|---|---|
| Pipeline failure rate | `analysis_failed` | `reason` (`invalid_app_id`, `rate_limited`, `invalid_api_key`, `provider_unreachable`, `invalid_response`, `network_error`, `unknown`). A rising failure rate as usage grows means the pipeline isn't scaling, not that demand is real. |
| Feedback sentiment | `feedback_submitted` | `value` (`up`\|`down`). Thumbs-down rate rising alongside report volume means growth is outpacing quality. |
| Analysis latency | `analysis_completed.duration_ms` | A rising p95 duration degrades the "progress screen with real step messages" promise into a stall. |

## Quality / trust proxy

- **`feedback_submitted` thumbs-up rate** = `up` events / (`up` + `down` events). This is
  the closest signal to "was the report actually good," short of running structured user
  interviews (see [`user-interview-guide.md`](user-interview-guide.md)).

## A/B test property

Every event above also carries an `onboarding_variant` property (`"control"` or
`"test"`), set once per session as a PostHog persistent super-property (see
`initAnalytics()` in `analytics.ts`). This lets any of the above metrics be sliced by
variant without an extra join. Full test design in
[`ab-test-plan.md`](ab-test-plan.md).

## What's deliberately not tracked (v1)

- No tracking of *which themes* get RICE-edited toward higher vs. lower scores — would
  be useful for a v1.1 "which themes do PMs actually trust the model's defaults on"
  analysis, but adds event volume without a near-term decision it unblocks.
- No server-side event deduplication/retry logic — acceptable at this scale; revisit if
  event volume ever matters for billing or SLA reporting.
