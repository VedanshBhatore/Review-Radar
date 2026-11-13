# Case study: ReviewRadar

*Portfolio write-up. Every `[TODO: real number]` below is a placeholder for data this
project doesn't have yet (no real users, no completed interviews, no PostHog history at
time of writing) — fill in only with real measured numbers, never invented ones.*

## Problem

PMs and founders at consumer apps get a continuous stream of Play Store reviews and
read almost none of them. Reviews are free, high-volume, unfiltered feedback — but
reading 500 of them to find the 5-8 themes that actually matter is a multi-hour task
nobody has time for every week. The result is roadmaps driven by whoever's loudest in a
Slack thread, not by what users are actually saying at scale.

I wanted to build something that demonstrates the full PM skillset, not just "prompt an
LLM to summarize text": problem framing, a prioritization framework (RICE) applied
correctly (including its edge cases — zero reviews, praise-only themes, confidence
bands), a defensible metrics tree, and an A/B test plan with real sample-size math —
wrapped around a product that's actually usable end-to-end, including a path that needs
no API key at all.

## Research

`[TODO: real number — N interviews completed]` user interviews are planned using
[`docs/user-interview-guide.md`](user-interview-guide.md) but have not yet been run as
of this write-up. The guide itself — 10 non-leading questions about current review-reading
behavior, plus a structured notes-synthesis template — is the actual research
instrument; this case study will be updated with real findings once interviews happen.

What *is* grounded in something concrete: the choice of RICE (not ICE, not a simple
upvote count) as the scoring framework reflects common PM practice for comparing
heterogeneous opportunities (a bug fix vs. a feature request) on a single axis, and the
decision to always rank praise themes last — rather than hide them — came from
reasoning through what a PM actually wants from this: validation signal, not a disguised
roadmap item competing for the same slot as a real bug.

## Insight

The working assumption — not yet validated with real interviews — is that the bottleneck
isn't *wanting* to read reviews, it's the combination of (a) volume making manual
reading impractical past a certain scale, and (b) the lack of a lightweight framework to
turn "people are mad about delivery" into something comparable against "people want a
feature." A tool that only does theme extraction (many exist) solves (a) but not (b). A
tool that only gives you a scoring template (spreadsheets) solves (b) but not (a).
ReviewRadar's bet is that doing both in one pass — and grounding every score in a real
count the PM can double-check — is what makes the output trustworthy enough to act on.

This is a hypothesis to test with real interviews and real usage, not a confirmed
insight yet.

## Solution

What got built (see [`docs/PRD.md`](PRD.md) for full scope):

- A client-orchestrated pipeline (fetch → batch-theme → merge → score → save) so no
  single server call has to process 500 reviews' worth of LLM work at once, with a
  progress screen showing real step messages instead of a spinner.
- A provider-agnostic LLM interface (`lib/llm.ts`) supporting Claude, Gemini, or a fully
  deterministic offline mock — meaning the whole product, including the demo on the
  landing page, works with zero API keys and zero network calls.
- RICE scoring as pure, unit-tested functions (`lib/rice.ts`) — reach from mention
  share, confidence from mention volume, impact/effort from the LLM (editable by the
  PM, who knows their own codebase better than a model does), with praise themes always
  ranked last regardless of score.
- One-click PRD generation that's contractually forbidden from inventing quotes or
  numbers — every quote comes from `representative_review_ids` resolved against the
  actual fetched review text, and unknowable things (user segments, root cause) are
  marked `[TODO]` in the output rather than hallucinated.
- A full analytics instrumentation layer (11 events, an activation funnel, an A/B flag
  with persistent-property attachment) that silently no-ops without a PostHog key, so
  the product doesn't require analytics infrastructure to run.

## Metrics

North Star: **reports generated per week** (`analysis_completed` events). Full metric
tree, funnel definition, and guardrails are in [`docs/metrics.md`](metrics.md), mapped to
exact event names in code so the dashboard-building step is just wiring up a PostHog
project, not re-deriving what to track.

`[TODO: real number — reports generated per week once there's real traffic]`
`[TODO: real number — activation funnel conversion rates once there's real traffic]`
`[TODO: real number — feedback thumbs-up rate once there's real feedback]`

## Learnings

- **Browser-testing the actual pipeline caught a real bug that code review alone
  wouldn't have.** The mock theme classifier had a fallback rule that dumped any
  unmatched low-rated review into the "quality" bucket; running the demo flow in a real
  headless browser and reading the rendered output surfaced a support complaint showing
  up as a "quality" quote. Fixed by making the fallback honest (unmatched negative
  reviews go to "other," not a guessed specific category) and auditing every demo
  template against the keyword rules. The lesson: a classifier (even a deterministic
  mock one) needs to be checked against its actual output, not just its code.
- **Deciding what *not* to build was as important as what to build.** No multi-tenant
  accounts, no scheduled re-analysis, no iOS support in v1 — each was a real feature a
  real PM would eventually want, each deliberately deferred so the core loop (one app,
  one report, real evidence, a usable PRD) shipped completely rather than five things
  shipping halfway.
- **Writing the PRD-generation prompt to refuse invented numbers was harder than
  writing it to produce good prose.** The easy version of this feature lets an LLM
  write a plausible-sounding PRD; the useful version makes it impossible for the model
  to fabricate a quote or a user count, which meant structuring the prompt and the data
  passed into it (not just instructing "don't make things up") so fabrication wasn't
  available as an option.

## Next

- Run the 6-8 user interviews in [`docs/user-interview-guide.md`](user-interview-guide.md)
  and update Research/Insight above with real findings — including if they contradict
  the working hypothesis.
- Get real usage (share the demo, get a few PMs to run it on their own app) before
  running the `onboarding_variant` A/B test — [`docs/ab-test-plan.md`](ab-test-plan.md)'s
  sample-size math needs a real baseline activation rate, not the placeholder used in
  that doc's worked example.
- If real usage validates the core loop, the highest-leverage v1.1 candidates (per
  [`docs/PRD.md`](PRD.md)'s release plan) are scheduled re-analysis with trend
  comparison across runs, and iOS review ingestion.
