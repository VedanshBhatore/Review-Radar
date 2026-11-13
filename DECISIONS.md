# Decisions log

One line each: decision + why.

- Scaffolded with `create-next-app@latest` (Next 16.4.6, TS, Tailwind v4, App Router, `src/`) — matches the "latest Next.js" requirement.
- Disabled the `cacheComponents` / `partialPrefetching` experimental flags that `create-next-app` enabled by default — no local framework docs were available (`node_modules/next/dist/docs` doesn't exist in this version, no `AGENTS.md` was generated) and this app's pages are inherently request-dynamic (report-by-id, POST orchestration routes); the explicit `force-dynamic` model is far safer to build against without docs to verify the newer caching semantics.
- Used Next 16's async `params`/`searchParams` (Promise-based) convention everywhere, since the Next-15-era sync shim was removed in 16.
