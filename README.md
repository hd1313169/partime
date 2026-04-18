<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Salary Tracker Local Development

This project now runs as a single-repo full-stack app:
- Frontend: Vite + React (`http://localhost:3000`)
- Backend (migration in progress): Cloudflare Worker API (`http://localhost:8787` in local dev)

## Prerequisites

- Node.js 20+

## Local Development

1. Install dependencies:
   `npm install`
2. Start full-stack preview:
   `npm run dev`
3. Open:
   `http://localhost:3000`

When `npm run dev` starts successfully, you should see both:
- `VITE ... Local: http://localhost:3000/`
- `wrangler ... Ready on http://localhost:8787`

## Optional Split Mode

- Frontend only: `npm run dev:client`
- Legacy Express backend only: `npm run dev:server`
- Worker only: `npm run dev:worker`

## Cloudflare Baseline (Task 1)

- Worker config: `wrangler.toml`
- Local Worker env template: `.dev.vars.example`
- Worker tests: `npm run test:worker`

Current status:
- Worker entrypoint (`worker/index.ts`) is not implemented yet.
- `npm run test:worker` is expected to fail until Worker implementation tasks are completed.
- `npm run dev:worker` is expected to fail for the same reason in Task 1.

## Deployment

- Do not use `npm run deploy` directly (it intentionally exits with instructions).
- Use explicit environment deploy commands only:
   - `npm run deploy:staging`
   - `npm run deploy:production`

## Validation Commands

- Type check: `npm run lint`
- Server tests: `npm run test:server`
- Client tests: `npm run test:client`
- Worker tests: `npm run test:worker`
- Full test suite: `npm run test`
