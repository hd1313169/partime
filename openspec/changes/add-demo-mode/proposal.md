## Why

The user wants to showcase this app's UI and interaction logic (weekly/monthly views, job management, logging, Excel export) in a portfolio, publicly, without exposing or depending on the real backend (Worker API + D1 database) and without requiring visitors to have credentials for the now-secured production API (see `secure-worker-api`).

## What Changes

- Add a build-time "demo mode" (`VITE_DEMO_MODE=true`, selected via `vite build --mode demo`) in which the app uses an in-memory, `localStorage`-backed mock of the data layer instead of calling the real API - no network requests to any backend occur.
- Seed the demo with realistic sample jobs/logs/weekly prices so a first-time visitor immediately sees a populated app.
- Persist demo data changes to the visitor's own browser `localStorage` so their edits survive a page reload, isolated per-visitor.
- Add a "reset demo data" action, visible only in demo mode, that clears the visitor's local demo data and reloads the seed data.
- Add a GitHub Actions workflow that builds and publishes the demo to a `gh-pages` branch of this repo whenever a push to `main` touches frontend-relevant paths (excluding backend-only paths like `server/`, `worker/`, docs).
- Configure the demo build's base path for GitHub Pages project-site hosting (`hd1313169.github.io/partime/`).

## Capabilities

### New Capabilities
- `demo-mode`: a backend-free, seeded, locally-persisted mode of the app for public demonstration, including the reset action and the build/deploy mechanics that publish it to GitHub Pages.

### Modified Capabilities
(none — no existing specs predate this change)

## Impact

- `src/services/salaryApi.ts`: branch to export a mock implementation when `VITE_DEMO_MODE === 'true'`.
- New `src/services/salaryApi.mock.ts`: in-memory store backed by `storageManager.ts` (currently unused) for persistence, matching the existing `salaryApi` interface exactly - no changes needed to `App.tsx` or any screen component.
- New `src/services/seedData.ts`: sample jobs/logs/weeklyPrices.
- Small UI addition (reset button), rendered conditionally on demo mode.
- New `.env.demo`, a `build:demo` script in `package.json`, and a mode-aware `base` in `vite.config.ts`.
- New `.github/workflows/deploy-demo.yml` with path filters excluding backend-only files.
- No changes to `server/`, `worker/`, or any database schema/migrations.
