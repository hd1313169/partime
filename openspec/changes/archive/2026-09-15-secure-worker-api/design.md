## Context

See proposal.md - Why. Relevant current state:

- `worker/http/create-api.ts` builds a single Hono app (`createApi()`) shared by all environments; `wrangler.toml` defines `staging` and `production` environments with their own D1 bindings but no auth-related vars today.
- `src/services/apiClient.ts` is the single chokepoint all frontend API calls go through (`apiRequest`), and already centralizes error handling (`mapApiError`) - the natural place to attach an auth header and react to `401`.
- The frontend is deployed to Cloudflare Pages separately from the Worker (`npm run deploy:pages` vs `npm run deploy:staging` / `deploy:production`), so the two are not deployed atomically.
- Local dev (`npm run dev`) runs `vite` + `wrangler dev` together, with Vite proxying `/api/*` to the local Worker (same-origin from the browser's perspective) - CORS restrictions do not affect this path.
- This change is unrelated to `add-demo-mode`: the demo build never calls the Worker (its mock API layer makes no network requests), so the demo's GitHub Pages origin never needs to be in the Worker's CORS allow-list.

## Goals / Non-Goals

**Goals:**
- Require a shared secret on every mutating/read call to the deployed Worker API (except `/api/health`).
- Restrict CORS to known, explicitly configured frontend origins per environment.
- Let the real frontend user unlock once per browser and stay unlocked indefinitely.

**Non-Goals:**
- Multi-user accounts, per-user credentials, or session expiry - this is a single-user personal tool; one shared secret is sufficient.
- Protecting the local Express dev server (`server/`) or local `wrangler dev` - local dev stays open by default since it's not internet-reachable in normal use.
- Rotating the secret automatically or building any secret-management UI - rotation is a manual `wrangler secret put` when/if ever needed.

## Decisions

**Shared secret via Worker binding, not a database-backed credential.**
Store `APP_SECRET` as a Cloudflare Worker secret (`wrangler secret put APP_SECRET --env staging|production`), read from `c.env.APP_SECRET` in a Hono middleware. Alternative considered: store a hashed credential in D1 and add a `/api/login` endpoint - rejected as unnecessary complexity for a single static secret with no rotation/multi-user requirement.

**Middleware checks a custom header (`X-App-Secret`), not `Authorization: Bearer`.**
Avoids any ambiguity with future OAuth/Bearer schemes and keeps the check trivially simple: `c.req.header('X-App-Secret') === c.env.APP_SECRET`. Applied to all `/api/*` routes except `/api/health`, which stays open so uptime checks keep working without credentials.

**CORS allow-list is a per-environment plain var, not a secret.**
Origins aren't sensitive, so `ALLOWED_ORIGIN` (or a comma-separated `ALLOWED_ORIGINS`) goes in `wrangler.toml` under `[env.staging.vars]` / `[env.production.vars]`, alongside the existing `API_PREFIX` pattern. The Hono `cors()` middleware's `origin` option becomes a function that checks the request's `Origin` header against this list instead of `'*'`.

**Client stores the secret in `localStorage`, unprompted persistence, no expiry.**
`apiClient.ts` reads a stored secret (new key, e.g. `salary_tracker_app_secret`) and attaches it as `X-App-Secret` on every request when present. On a `401` response, `apiRequest` clears the stored secret and throws a distinguishable error (e.g. a `code: 'UNAUTHORIZED'` shape) so `App.tsx` can flip into a "locked" state and render the unlock prompt, mirroring the existing `apiError` handling already in `App.tsx`. Alternative considered: a cookie with `Secure`/`HttpOnly` - rejected because `HttpOnly` cookies can't be set from a static Pages frontend without a server-side response header from the Worker on a same-origin request, and the frontend and Worker are on different origins (Pages vs `workers.dev`), which reintroduces the CORS-credentials complexity this change is trying to avoid using a plain header. This is a deliberate trade-off documented in Risks below.

**Local dev server (`server/`) and `wrangler dev` remain unauthenticated.**
`apiClient.ts` still sends the header if one happens to be stored, but neither `server/app.ts` nor local `wrangler dev` (no `APP_SECRET` set locally by default) check it, so local development has zero new friction. Only the deployed staging/production Workers enforce the check (because only those have `APP_SECRET` configured as a real secret).

## Risks / Trade-offs

- **[Risk] The secret sent as a plain header is visible to anyone who opens browser devtools on the user's own machine** → Accepted: this defends against a public repo making the API URL casually discoverable and CRUD-able by strangers, not against someone with physical/devtools access to the user's own logged-in browser. Documented in proposal.md as the intended security level.
- **[Risk] Deploying the Worker (requiring the secret) and the Pages frontend (sending the secret) independently can create a short outage window** where the live frontend gets `401`s until both are deployed, or the frontend prompts for a secret before the Worker enforces it → Mitigation: Migration Plan below sequences the one-time rollout to minimize this window; since this is a single-user tool, a few minutes of self-inflicted downtime during the user's own deploy is acceptable and not treated as a production incident.
- **[Risk] Forgetting to set `APP_SECRET` for an environment** leaves that Worker rejecting all requests with `401` (fails closed) rather than silently open → Accepted as the safer failure mode; a missing binding should not be treated as "no auth required."

## Migration Plan

One-time rollout, no ongoing migration needed afterward:

1. `wrangler secret put APP_SECRET --env staging` and `--env production` - generate a long random value (e.g. `openssl rand -hex 32`) and record it somewhere the user (sole operator) can retrieve it, since it will be needed for the unlock prompt.
2. Add `ALLOWED_ORIGIN`(S) to `wrangler.toml` for both `env.staging.vars` and `env.production.vars`.
3. Deploy the updated Worker (`npm run deploy:staging`, then `npm run deploy:production`) - at this point the Worker starts requiring the header; the currently-deployed frontend (which doesn't send it yet) will start seeing `401`s until step 4.
4. Deploy the updated frontend (`npm run deploy:pages` or equivalent) with the unlock-prompt/header logic.
5. Open the live site once, paste the `APP_SECRET` value from step 1 into the unlock prompt - it persists in that browser's `localStorage` from then on.

Rollback: if something goes wrong, redeploying the previous Worker version (Cloudflare dashboard or `wrangler rollback`) removes the auth requirement immediately; no data migration is involved since this change touches no stored data, only request handling.

## Open Questions

- Exact `ALLOWED_ORIGIN` value(s) for production/staging Pages domains (e.g. whether a custom domain is also in use beyond `*.pages.dev`) - confirm at implementation time by checking the actual Cloudflare Pages project settings; doesn't change the approach, only a config value.
