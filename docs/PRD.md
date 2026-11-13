# PRD: ReviewRadar

**Status:** v1 shipped (portfolio project) · **Owner:** Vedansh Bhatore · **Last updated:** 2026-11-13

## Problem

PMs and founders at consumer apps — especially fast-growing Indian quick-commerce,
fintech, and D2C apps — get thousands of Play Store reviews a week and read almost none
of them. Reviews are the cheapest, most continuous source of unfiltered user feedback a
team has, but they're unstructured, repetitive, and mostly noise. The result: roadmap
prioritization ends up driven by whoever shouted loudest in a Slack thread, not by what
the review volume actually says.

Two sub-problems compound this:

1. **Reading cost.** Skimming 500 reviews to find 5-8 real themes takes hours a PM
   doesn't have, every week, for every app they own.
2. **Prioritization cost.** Even once themes are found, turning "a lot of people
   complain about delivery delays" into a scored, comparable roadmap item (vs. "people
   want a dark mode") takes a structured framework most teams skip under time pressure.

## Personas

- **Priya, PM student** — building a portfolio project, wants to practice synthesizing
  real user feedback into a PRD the way a working PM would, without access to a live
  product's review stream.
- **Rahul, growth-stage PM** — owns a consumer app with 10K+ monthly reviews, needs a
  weekly read on "what's actually breaking" without manually tagging reviews.
- **Ananya, solo founder** — no PM headcount, needs a fast gut-check on what to fix next
  before a release, grounded in something more concrete than her own intuition.

## User stories

1. As a PM, I want to paste my app's Play Store ID and get back themes with real
   quotes, so I don't have to read every review myself.
2. As a PM, I want each theme scored with RICE so I can defend a prioritization call in
   a planning meeting instead of arguing from anecdote.
3. As a PM, I want to edit a theme's Impact/Effort inline (I know my codebase better
   than an LLM does) and see the score update live.
4. As a PM, I want a PRD draft for my top theme in one click, using real review text
   as evidence, so writing the first draft isn't the bottleneck.
5. As a founder with no review data handy, I want to try the tool on a sample app (or a
   synthetic demo) before trusting it with my own app.
6. As a PM, I want to share a report link with my team and export it as a PDF for a
   deck or a Notion doc.
7. As a returning PM, I don't want to accidentally burn API quota re-analysing the same
   app twice in one day without being warned.

## North Star metric

**Reports generated per week.** Not reviews fetched, not pageviews — a completed report
is the moment the tool has actually done the reading-and-structuring work a PM would
otherwise do by hand. It's the clearest proxy for "people are trusting this enough to run
it again."

## Success metrics

See [`docs/metrics.md`](metrics.md) for the full metric tree and exact PostHog event
mapping. Summary:

- **North Star:** reports generated per week.
- **Activation:** `landing_viewed → analysis_started → analysis_completed → prd_generated` funnel conversion.
- **Quality proxy:** `feedback_submitted` thumbs-up rate.
- **Guardrail:** `analysis_failed` rate (a broken pipeline shouldn't masquerade as "low interest").

## Scope (v1 — what's shipped)

- Play Store review fetch (up to 500 newest, `en`/`in`), 24h cache per app, CSV upload
  fallback, and a synthetic offline demo dataset.
- LLM-based theme extraction (batched) and merge, behind a provider interface
  supporting Claude, Gemini, or a fully offline mock (so the tool works with zero API
  keys).
- RICE scoring with inline-editable Impact/Effort and live score recalculation.
- Charts: rating distribution, theme share, weekly rating/1-star trend, 1-star drivers.
- One-click PRD generation per theme, grounded in real counts and quotes, cached with a
  regenerate option.
- Share link, PDF export (print stylesheet), thumbs up/down feedback with optional
  comment.
- PostHog analytics on the full activation funnel plus an `onboarding_variant` A/B test
  on the landing page.

## Non-goals (v1)

- **Not a review-moderation or reply tool.** ReviewRadar doesn't help you respond to
  reviews on the Play Store — it's a read-and-synthesize tool, not a CRM.
- **Not multi-platform.** iOS App Store reviews are out of scope for v1; the scraper and
  UI are Play-Store-specific.
- **Not a persistent dashboard.** Each analysis produces a point-in-time report; there's
  no scheduled re-analysis, alerting, or historical report comparison across runs yet.
- **Not a replacement for user interviews.** Review text answers "what," rarely "why."
  The product explicitly marks PRD sections it can't know (user segments, root cause)
  with `[TODO]` rather than guessing.
- **Not multi-tenant/team accounts.** No auth, no org-level report library, no
  permissions — v1 is single-user, link-sharing only.

## Risks

- **LLM cost/latency at scale.** Theming 500 reviews is 5+ LLM calls per report; at high
  volume this is the main cost driver. Mitigated by batching, a fast/smart model split,
  and a free offline mock mode.
- **Review text ≠ ground truth.** Mention counts reflect review-writing behavior, not
  necessarily the true incidence of an issue (angry users write reviews more than happy
  silent ones). The PRD template explicitly flags this as a risk rather than hiding it.
- **Play Store scraping is unofficial.** `google-play-scraper` isn't a sanctioned API and
  can break on Play Store changes; there's no SLA. Mitigated by the CSV fallback and
  cached results.
- **Praise-dominated reports.** An app with mostly positive reviews may not surface a
  clear "top opportunity" — handled by ranking praise themes last rather than hiding them,
  so the report stays honest about what it found.

## Release plan

- **v1 (shipped):** everything in Scope above, as a single always-available web app.
- **v1.1 (candidate, not built):** iOS review ingestion; scheduled weekly re-analysis
  with trend-over-time comparison across reports for the same app.
- **v1.2 (candidate, not built):** team accounts + a report library, so a PM doesn't
  need to keep track of individual share links.

No committed dates — this is a portfolio project, not a funded roadmap. The order above
reflects what would most increase the North Star metric (more reports per week) if this
went from a weekend build to something a small team actually used weekly.
