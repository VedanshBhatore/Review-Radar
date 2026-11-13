# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repository.

## What this is

ReviewRadar: paste a Google Play app ID, get review themes, RICE-scored opportunities,
trend charts, and a one-click PRD draft. Full product context in `README.md` and
`docs/PRD.md`. Build rationale and non-obvious decisions are logged in `DECISIONS.md` —
read it before second-guessing something that looks like an odd choice (e.g. why
`cacheComponents` is off, why the Supabase schema uses jsonb blobs instead of
normalized tables).

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript (strict) + Tailwind CSS v4. LLM calls go
through one interface (`src/lib/llm.ts`) with three providers: `claude`, `gemini`,
`mock`. Storage goes through one interface (`src/lib/store.ts`) with two adapters: local
JSON files (`.data/`, gitignored, dev only) and Supabase (production). Vitest for tests.
PostHog (`posthog-js`) for analytics, silently no-op without a key.

## Commands

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build — also the real type-check; run before any commit
npm run typecheck   # tsc --noEmit only
npm run lint        # eslint
npm run test         # vitest run, once
npm run test:watch   # vitest watch mode
```

Always run `npm run build` (not just `typecheck`) before considering a change done —
`next build` catches things `tsc --noEmit` alone doesn't (route conflicts, client/server
boundary violations, etc).

## Architecture — read before touching routes or the pipeline

The analysis pipeline is **client-orchestrated**: the browser drives a sequence of short
POST calls (`/api/reviews` → `/api/themes/batch` ×N, 3 at a time → `/api/themes/merge` →
`/api/reports`) rather than one long server call. This exists specifically so no single
serverless function has to do 500 reviews' worth of LLM work in one invocation, and so
the UI can show real progress. See `README.md`'s Mermaid diagram and
`src/hooks/useAnalysis.ts` before changing this flow — don't collapse it back into a
single server-side call without understanding why it was split.

**Theme merging never trusts the LLM's own counts.** The model (or mock) only decides
*which candidate indices group together* plus impact/effort; `src/lib/merge.ts` does the
actual review-ID union, dedup, invalid-ID dropping, and "forgotten candidate" fallback in
plain code. If you touch merge logic, the existing invariants (tested in
`test/merge.test.ts`) must still hold: no candidate used twice, IDs that don't exist get
dropped, a candidate the model forgot is kept standalone if it has 3+ valid reviews.

**RICE math lives in `src/lib/rice.ts`, pure functions only.** Reach/confidence/score
are derived, never hand-edited; only impact/effort are user-editable (via the RICE
table), and editing them calls `recomputeTheme()` to keep reach/confidence/score
consistent. Don't let a UI component compute a RICE score inline — route it through
`rice.ts`.

## Conventions

- **Async `params`/`searchParams` everywhere** — Next 16 removed the sync shim. Route
  handlers and pages both take `Promise<{...}>` and must `await` it.
- **`cacheComponents` is intentionally off** (see `next.config.ts` + `DECISIONS.md`).
  Pages/routes use the "previous model": dynamic by default, no `force-dynamic`
  incompatibility surprises. Don't turn it back on without re-reading the Next 16 caching
  docs (`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`
  if present, or the Next.js site) and re-testing every dynamic route.
- **Friendly errors are a feature, not a nice-to-have.** `src/lib/api-errors.ts` maps
  every thrown error type (`LlmError`, `ScraperError`, `ZodError`) to a specific HTTP
  status and a message that says what went wrong and how to fix it. New failure modes
  should get a matching `reason` code, not a generic 500.
- **The mock LLM provider is a real product feature, not a test stub.** It powers the
  landing page's "Try the demo" button and is the zero-API-key default. Treat bugs in
  `src/lib/llm/mock.ts` as real product bugs — see `DECISIONS.md` / git history for an
  example (a keyword-fallback bug that mislabeled reviews, caught by actually running
  the demo flow in a browser, not just by reading the code).
- **Never let an LLM write a review quote from memory.** Quotes always come from
  `representative_review_ids` resolved against the real fetched `Review[]`. This applies
  to both the theme-batch step and PRD generation.
- No code comments explaining *what* code does; only *why*, when non-obvious (see the
  repo's existing comment density as the bar).

## Before committing

1. `npm run build` — zero errors.
2. `npm run test` — all passing.
3. If you touched any UI, actually drive it in a browser (Playwright via a scratch
   script is fine — see prior session's approach) rather than trusting types + tests
   alone for frontend changes. This project has already caught one real bug this way
   that neither typecheck nor unit tests would have found.
4. Update `DECISIONS.md` with one line for any non-obvious call you made.
5. Git identity in this repo is the human owner's, not an AI's — do not add yourself as
   a contributor or co-author on commits.
