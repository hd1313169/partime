## Why

The production Worker API (`partime-api-production.wsad71155.workers.dev/api`) has no authentication and permissive CORS (`origin: '*'`), so anyone who obtains the URL can read, create, update, or delete the real salary data. The URL is currently hardcoded in `src/services/apiClient.ts` as `PRODUCTION_WORKER_API_BASE_URL`; once the repo is made public (planned to support a GitHub Pages demo), that URL becomes trivially discoverable, turning a theoretical exposure into a practical one.

## What Changes

- Add a shared-secret check (`X-App-Secret` header) to the Worker, validated against a Cloudflare secret (`wrangler secret put APP_SECRET`) not stored in the repo. **BREAKING**: any client calling the Worker API must now send this header or receive `401 Unauthorized`.
- Restrict CORS `origin` on the Worker from `'*'` to the actual deployed frontend origin(s) instead of allowing every origin. This is a defense-in-depth measure, not a substitute for the secret check (CORS does not block non-browser clients).
- Add a one-time "unlock" prompt in the real frontend app: on first load, if no valid stored secret is found, prompt the user to paste the app secret; once accepted, persist it in `localStorage` (no expiry) and attach it to every subsequent API request via `X-App-Secret`. Re-prompt automatically if a request is rejected with `401`.
- Document the manual step of provisioning `APP_SECRET` for staging and production via `wrangler secret put`.

## Capabilities

### New Capabilities
- `worker-api-auth`: shared-secret authentication and CORS origin restriction for the Worker HTTP API, plus the one-time client-side unlock flow that supplies the secret.

### Modified Capabilities
(none — no existing specs predate this change)

## Impact

- `worker/http/create-api.ts`: add auth middleware, change CORS `origin` option.
- `worker/index.ts` / `WorkerEnv`: add `APP_SECRET` binding.
- `wrangler.toml`: no new plaintext vars (secret is provisioned out-of-band via `wrangler secret put`, not committed).
- `src/services/apiClient.ts`: attach stored secret header to every request; handle `401` by clearing the stored secret and prompting again.
- New small UI: an "unlock" gate component shown when no valid secret is stored.
- `server/` (local Express dev server) is unaffected — this targets the deployed Worker API; local dev can optionally honor the same header for parity, decided in design.md.
- Deployment runbooks (`npm run deploy:staging` / `deploy:production`) gain a one-time manual step to set `APP_SECRET` per environment.
