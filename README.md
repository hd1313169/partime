<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Salary Tracker Local Development

This project now runs as a single-repo full-stack app:
- Frontend: Vite + React (`http://localhost:3000`)
- Backend: Express + SQLite (`http://localhost:4000`)

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
- `API listening on 4000 using db ./salary.sqlite`

## Optional Split Mode

- Frontend only: `npm run dev:client`
- Backend only: `npm run dev:server`
- Worker only: `npm run dev:worker`

## Cloudflare Baseline (Task 1)

- Worker config: `wrangler.toml`
- Local Worker env template: `.dev.vars.example`
- Worker tests: `npm run test:worker`

Current status: Worker API routes are not implemented yet, so the worker smoke test is expected to fail until later tasks are completed.

## Validation Commands

- Type check: `npm run lint`
- Server tests: `npm run test:server`
- Client tests: `npm run test:client`
- Worker tests: `npm run test:worker`
- Full test suite: `npm run test`
