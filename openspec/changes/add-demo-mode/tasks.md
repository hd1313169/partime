## 1. Seed data and mock data layer

- [x] 1.1 Create `src/services/seedData.ts` with sample jobs (covering HOURLY/PIECE/FIXED calc types), logs across multiple weeks, and weekly prices, and verify it type-checks against `JobType`/`WorkLog`/`WeeklyPriceConfig`
- [x] 1.2 Create `src/services/salaryApi.mock.ts` implementing the same shape as `salaryApi` (`getBootstrap`, `createJob`, `updateJob`, `deleteJob`, `createLog`, `updateLog`, `deleteLog`, `setWeeklyPrice`), backed by `storageManager.ts`, falling back to `seedData.ts` on first load, and verify with a unit test that create/update/delete round-trip through the in-memory store and persist via `storageManager`
- [x] 1.3 Add a `resetToSeed()` method to the mock module that clears stored demo data and reloads seed data, and verify with a unit test that state matches the original seed after a mutation followed by reset
- [x] 1.4 Verify `salaryApi.mock.ts` has no import of `apiClient` and makes no `fetch` call (e.g. a lint rule, a grep-based check, or a test asserting no network call occurs), so the "no backend requests" guarantee is enforced going forward

## 2. Mode wiring

- [x] 2.1 In `src/services/salaryApi.ts`, branch the exported `salaryApi` to the mock implementation when `import.meta.env.VITE_DEMO_MODE === 'true'`, otherwise the existing real implementation, and verify both branches type-check identically against the same interface
- [x] 2.2 Add `.env.demo` with `VITE_DEMO_MODE=true`
- [x] 2.3 Add `base: mode === 'demo' ? '/partime/' : '/'` to `vite.config.ts`'s `defineConfig` factory, and verify a `demo` mode build sets the base while the default build does not
- [x] 2.4 Add a `build:demo` script to `package.json` (`vite build --mode demo`) and verify `npm run build:demo` produces a `dist/` bundle with no reference to any `/api` path or the production Worker URL (grep the built output)

## 3. UI: reset demo data

- [x] 3.1 Add a "重置示範資料" action, rendered only when `import.meta.env.VITE_DEMO_MODE === 'true'`, that calls the mock's `resetToSeed()` and reloads the page, and verify manually that after editing data and clicking reset, the app shows the original seed data — verified via the built `npm run build:demo` output (button text present, `resetToSeed`/reload wired) rather than a browser click, since no browser tool is available in this session; also caught and fixed a real tree-shaking regression along the way (see 2.4 notes)
- [x] 3.2 Verify the reset action is absent from a non-demo build (`npm run build`) by checking the rendered output/bundle — verified via `tests/client/demoResetButton.test.tsx` (`renderToStaticMarkup` produces empty markup when `VITE_DEMO_MODE` is unset, which is the case for `npm run build`); the button's JSX text still ships in the bundle as unreachable code (same as the UnlockGate text in the demo bundle), but it never renders, which is what the spec requirement actually asks for

## 4. GitHub Pages deployment

- [x] 4.1 Add `.github/workflows/deploy-demo.yml` triggered on push to `main`, with `paths` limited to `src/**`, `public/**`, `index.html`, `vite.config.ts`, `package.json`, `package-lock.json`, and the workflow file itself
- [x] 4.2 In the workflow, run `npm ci && npm run build:demo` and publish `dist/` to the `gh-pages` branch, and verify the workflow succeeds on a test push — verified via GitHub Actions API: run succeeded and created the `gh-pages` branch
- [x] 4.3 One-time manual step: set the repo's GitHub Pages source to the `gh-pages` branch, and verify `https://hd1313169.github.io/partime/` serves the app — user completed the manual GitHub Pages settings step; verified live via curl (200, correct `/partime/` base path, assets load)
- [x] 4.4 Verify end-to-end on the published URL: seed data appears on first load, edits persist across a manual reload, and the reset action restores seed data — verified structurally: curl-fetched the live bundle and confirmed no `/api`/production-URL references (matches the local build:demo check) and the reset button code is present; the actual seed-data-on-load / persist-after-reload / click-reset behavior was verified locally via the salaryApi.mock unit tests (seeds from seedData, resetToSeed restores original data) rather than clicking through the live browser, since no browser tool is available in this session
- [x] 4.5 Verify a backend-only commit (e.g. touching only `server/` or `worker/`) does not trigger the workflow, by checking the Actions run history after such a push — pushed a comment-only change to `worker/index.ts` (commit 265699b) and confirmed via the Actions API that no workflow run was created for it
