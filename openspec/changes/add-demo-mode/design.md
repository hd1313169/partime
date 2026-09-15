## Context

See proposal.md - Why. Relevant current state:

- `App.tsx` is the only module that imports `salaryApi`; every screen component (`WeeklySheet`, `MonthlyReport`, `LogModal`, `ReportModal`, `JobManagementModal`) receives data and callbacks as props and never calls the API or `fetch` directly. This gives a clean seam: swapping what `salaryApi` resolves to changes nothing about the screens.
- `src/services/storageManager.ts` already exists, unused, with a `localStorage`-backed get/save interface for jobs, logs, and weekly prices - matching what demo mode needs for persistence.
- IDs for new jobs/logs are generated client-side today (`Math.random().toString(36).substr(2, 9)` in `JobManagementModal.tsx` and `LogModal.tsx`), so the mock data layer never needs to generate or reconcile IDs - it only stores what it's given.
- `vite.config.ts` already resolves config via a `defineConfig(() => ...)` factory; there is precedent for mode-specific behavior (`build:pages` already uses `vite build --mode pages`, and `apiClient.ts` already branches on hostname for the Pages fallback API URL).
- The repo's remote is `hd1313169/partime`, so a GitHub Pages project site would be served at `https://hd1313169.github.io/partime/`, requiring `base: '/partime/'` in the Vite config for that build.
- This change is unrelated to `secure-worker-api`: the demo build never talks to the Worker at all, so it needs no knowledge of `APP_SECRET`, `X-App-Secret`, or the Worker's CORS allow-list.

## Goals / Non-Goals

**Goals:**
- Zero code changes to `App.tsx` or any screen component - the swap happens entirely inside the `salaryApi` module boundary.
- A demo visitor's data lives only in their own browser; no shared state between visitors.
- A single build mode (`demo`) produces a fully static, backend-free bundle deployable to GitHub Pages.

**Non-Goals:**
- Syncing demo data between devices/browsers for the same visitor.
- Simulating network latency/loading states (mock resolves immediately) - can be revisited later if desired, not required for this change.
- Any change to the real production data path, the Worker, or `server/`.

## Decisions

**Swap point lives inside `salaryApi.ts`, selected by `import.meta.env.VITE_DEMO_MODE`.**
`salaryApi.ts` exports either the real implementation (current behavior, calling `apiClient`) or a new mock implementation, decided once at module load based on the env var baked in at build time. Alternative considered: have `App.tsx` pick the implementation - rejected because it would leak demo-mode awareness into a component that currently has none, and every future consumer of `salaryApi` would need the same conditional.

**Mock implementation (`salaryApi.mock.ts`) is a thin in-memory store over `storageManager.ts`.**
On module load: read `storageManager.getJobs()/getLogs()/getWeeklyPrices()`; if all are `null` (first visit), initialize from `seedData.ts` and persist via `storageManager.saveJobs()/saveLogs()/saveWeeklyPrices()`. Each mutating method (`createJob`, `updateJob`, `deleteJob`, `createLog`, `updateLog`, `deleteLog`, `setWeeklyPrice`) updates the in-memory arrays/object and immediately persists the affected slice via `storageManager`, then resolves a `Promise` - matching the async signatures `App.tsx` already awaits. `getBootstrap()` returns the current in-memory snapshot.

**Seed data lives in a dedicated `seedData.ts`, not inline in the mock.**
Keeps the mock implementation focused on the read/write mechanics and makes the sample data easy to review/tweak independently (a few weeks of varied jobs - hourly, piece-rate, fixed - and logs, so weekly/monthly views and Excel export all have something meaningful to show).

**Reset action reads mode from the same `VITE_DEMO_MODE` flag and calls a new `resetToSeed()` method added only on the mock.**
`App.tsx` (or a small new component it renders) checks `import.meta.env.VITE_DEMO_MODE === 'true'` to conditionally render a "重置示範資料" button; clicking it calls `storageManager.clearAll()` then reloads seed data into the mock's in-memory store and triggers a re-fetch of bootstrap data into React state (simplest: trigger `window.location.reload()` after clearing, so the existing bootstrap-on-mount flow in `App.tsx` re-runs unchanged). Alternative considered: a dedicated in-app re-render path - rejected as unnecessary complexity when a reload achieves the same result with less code, and this is a low-frequency, non-critical action.

**GitHub Pages base path is mode-conditional in `vite.config.ts`.**
`base: mode === 'demo' ? '/partime/' : '/'` inside the existing `defineConfig(({ mode }) => ...)` factory (the factory already receives `mode`, currently unused for this purpose).

**Deploy target is the `gh-pages` branch of this same repo, built by a path-filtered GitHub Actions workflow.**
Workflow triggers on push to `main` with `paths` limited to `src/**`, `public/**`, `index.html`, `vite.config.ts`, `package.json`, `package-lock.json`, and the workflow file itself - excluding `server/**`, `worker/**`, `docs/**`, `.wrangler/**`, migrations, and other backend-only paths, so purely backend changes don't trigger a demo rebuild/deploy. It runs `npm ci && npm run build:demo`, then publishes `dist/` to `gh-pages` (e.g. via `peaceiris/actions-gh-pages` or `actions/deploy-pages`, decided at implementation time). GitHub Pages settings for the repo need to be pointed at the `gh-pages` branch (one-time manual step, since Pages configuration itself isn't something a workflow can bootstrap on its own without the Pages API).

## Risks / Trade-offs

- **[Risk] A future change accidentally makes `salaryApi.mock.ts` import `apiClient` or call `fetch`**, silently breaking the "never talks to the backend" guarantee → Mitigation: add a task to verify (e.g. grep the built demo bundle for the production API URL string, or a simple test asserting the mock module has no import of `apiClient`) as part of this change's task list, so it's caught once and doesn't need ongoing manual re-verification.
- **[Risk] `Math.random()`-based IDs (existing, unrelated to this change) could theoretically collide within a single demo session** → Accepted: pre-existing behavior in the real app too, not something this change needs to fix; collision odds are negligible for a demo's data volume.
- **[Risk] GitHub Pages project-site `base` path is easy to get wrong (trailing slash, missing leading slash) and silently breaks all asset loading** → Mitigation: verify with an actual deployed check (load the published URL and confirm assets/JS load, not just that the build succeeds locally) as a task.

## Migration Plan

No production data or backend is touched. Rollout is additive:
1. Land the mock data layer, seed data, and mode wiring; verify locally with `npm run build:demo && npx vite preview --outDir dist --base /partime/` (or equivalent) before wiring CI.
2. Add the GitHub Actions workflow and push to `main` to produce the first `gh-pages` deploy.
3. One-time manual step: in the repo's GitHub settings, set Pages source to the `gh-pages` branch.
4. Verify the published `https://hd1313169.github.io/partime/` loads, shows seed data, persists edits across reload, and the reset action works.

Rollback: revert the workflow/commits, or simply stop pushing to `main`/delete the `gh-pages` branch - no effect on the real app or its data.
