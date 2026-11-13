# A/B test plan: `onboarding_variant`

## Hypothesis

Showing highlighted sample-app buttons (Blinkit/Zepto/Swiggy) next to the app-ID input
increases the share of landing-page visitors who start an analysis, because it lowers
the activation energy for someone who doesn't have an app ID memorized or isn't sure
what to type. Risk: it could instead distract from typing a real app ID, or make the
tool look like a toy demo rather than something to point at your own app.

## Variants

Implemented as the PostHog feature flag `onboarding_variant`, resolved once per session
in `getOnboardingVariant()` (`src/lib/analytics.ts`) and attached to every event as a
persistent property (see [`metrics.md`](metrics.md)).

| Variant | What's shown |
|---|---|
| `control` | App-ID input + Analyze button only. No sample-app buttons. (Demo button and CSV upload are unaffected by this flag — they're always visible in both arms.) |
| `test` (default/fallback) | Same, plus three highlighted sample-app buttons (Blinkit, Zepto, Swiggy) below the input. |

If PostHog isn't configured at all, the code falls back to `test` (see
`getOnboardingVariant()`) — so the richer experience is the default when there's no
experiment running, and `control` is the deliberately-reduced arm for the test.

## Primary metric

**Activation rate** = `analysis_started` events / `landing_viewed` events, per variant.
This isolates the effect on the specific friction point the hypothesis is about (getting
someone to start), rather than the full funnel to `prd_generated`, which is affected by
many things downstream of this UI change.

## Secondary metric

**Full-funnel conversion** = `analysis_completed` / `landing_viewed`, per variant — a
check that any lift in starts isn't just people clicking a sample button out of
curiosity and then abandoning once they see a real report forming.

## Guardrails (must not regress in either arm)

- **`analysis_failed` rate** — sample-app clicks shouldn't disproportionately hit
  Play-Store-side failures (rate limiting, unreachable) vs. organic app-ID entry; if they
  do, that's a confound, not a real variant effect.
- **`feedback_submitted` thumbs-up rate** — a variant that inflates starts via people who
  weren't going to analyse a *real* app anyway (just clicking a sample out of curiosity)
  could look like a win on activation while quietly producing less satisfied completions.

## Minimum sample size

Use a two-proportion z-test (standard for a binary activation metric). Formula per arm:

```
n = (z_α/2 + z_β)² × [p1(1-p1) + p2(1-p2)] / (p2 - p1)²
```

Where `p1` is the control baseline conversion rate, `p2 = p1 + MDE` is the expected rate
in the test arm (MDE = minimum detectable effect you care about), `z_α/2 = 1.96` for a
95% confidence two-tailed test, and `z_β = 0.84` for 80% power.

**Worked example** (replace `p1` with the real baseline once you have one —
`[TODO: real baseline activation rate from PostHog]`):

- Assume `p1 = 0.30` (30% of landing visitors start an analysis today — a placeholder,
  not a measured number).
- MDE of interest: 5 percentage points (`p2 = 0.35`) — pick the smallest lift that would
  actually change a decision about keeping this UI; don't chase a 1pp lift that doesn't
  matter operationally.
- Plugging in: `n ≈ (1.96 + 0.84)² × [0.30×0.70 + 0.35×0.65] / (0.05)² ≈ 7.84 × 0.4375 / 0.0025 ≈ 1,372` per arm.

So **~1,370 landing-page visitors per arm (~2,740 total)** before checking results, for a
5pp MDE at 95%/80%. If real traffic is far below that, either run longer, widen the MDE
you're willing to detect (accepting more risk of missing a true smaller effect), or treat
the result as directional only and pair it with qualitative feedback instead of a
significance claim.

A free online two-proportion sample-size calculator (e.g. Evan Miller's) will take the
same three inputs (`p1`, MDE, power) if you'd rather not re-derive the formula by hand —
the number above should match within rounding.

## Test duration

Run for **at least 2 full weeks** regardless of when the sample-size target is hit, to
average out day-of-week effects (weekday vs. weekend traffic composition) — stopping the
moment the number is reached risks ending on an unrepresentative day.

## Results template

Fill in after the test concludes (sample size AND 2-week minimum both met):

```markdown
## onboarding_variant — results, [date range]

- Landing views: control [n], test [n]
- Activation rate: control [X]%, test [Y]% (lift: [Z]pp, p-value: [TODO])
- Full-funnel conversion (landing -> analysis_completed): control [X]%, test [Y]%
- Guardrails: analysis_failed rate control [X]% vs test [Y]%; feedback thumbs-up rate
  control [X]% vs test [Y]%
- Decision: [ship test as default / keep control / inconclusive, extend]
- Notes / confounds observed:
```

[TODO: real numbers once the experiment has run — never fill this template with invented data.]
