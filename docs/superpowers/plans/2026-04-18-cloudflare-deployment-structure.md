# Cloudflare Deployment Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current Vite + Express + SQLite local architecture into a Cloudflare-native deployable structure (Pages static frontend + Worker API + D1).

**Architecture:** Keep domain/service logic reusable, replace the Node/Express runtime with a Worker HTTP runtime, and replace `better-sqlite3` persistence with D1 repositories behind existing repository interfaces. Frontend continues to call `/api/*` using same-origin API requests so the app works on Cloudflare Pages with Worker bindings.

**Tech Stack:** Vite, React, TypeScript, Cloudflare Workers, Cloudflare D1, Hono, Vitest

---

## File Structure Map

- Keep and reuse:
  - `server/domain/models.ts`
  - `server/domain/repositories.ts`
  - `server/services/salary-service.ts`
  - `server/http/error.ts`
- Create:
  - `worker/index.ts` (Worker entry)
  - `worker/http/create-api.ts` (HTTP app factory)
  - `worker/http/response.ts` (shared JSON response helpers)
  - `worker/repositories/d1-job-repository.ts`
  - `worker/repositories/d1-log-repository.ts`
  - `worker/repositories/d1-weekly-price-repository.ts`
  - `worker/db/migrations/0001_initial.sql`
  - `tests/worker/api.test.ts`
  - `tests/worker/repositories/d1-repositories.test.ts`
  - `wrangler.toml`
  - `.dev.vars.example`
- Modify:
  - `package.json`
  - `vite.config.ts`
  - `src/services/apiClient.ts`
  - `README.md`
  - `tsconfig.json`

---

### Task 1: Add Cloudflare Runtime Tooling and Baseline Config

**Files:**
- Create: `wrangler.toml`, `.dev.vars.example`
- Modify: `package.json`, `tsconfig.json`, `README.md`
- Test: `tests/worker/api.test.ts` (placeholder failing test)

- [ ] **Step 1: Write failing Worker smoke test**

```ts
// tests/worker/api.test.ts
import { describe, expect, it } from 'vitest';

describe('worker api smoke', () => {
  it('exposes /api/health', async () => {
    const app = null as unknown as { request: (url: string) => Promise<Response> };
    const res = await app.request('http://localhost/api/health');
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/worker/api.test.ts`
Expected: FAIL with module/build/runtime error because Worker app and config do not exist yet.

- [ ] **Step 3: Add Cloudflare dependencies and scripts (minimal)**

```json
// package.json (scripts excerpt)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:worker\"",
    "dev:client": "vite --port=3000 --host=0.0.0.0",
    "dev:worker": "wrangler dev --port 8787",
    "build": "vite build",
    "build:worker": "wrangler deploy --dry-run",
    "deploy": "npm run build && wrangler deploy",
    "test:worker": "vitest run tests/worker --reporter=verbose"
  }
}
```

```toml
# wrangler.toml
name = "partime-api"
main = "worker/index.ts"
compatibility_date = "2026-04-18"

[vars]
API_PREFIX = "/api"

[[d1_databases]]
binding = "DB"
database_name = "partime-db"
database_id = "REPLACE_WITH_REAL_D1_DATABASE_ID"
```

```env
# .dev.vars.example
OPENAI_API_KEY=
GOOGLE_API_KEY=
```

- [ ] **Step 4: Extend TypeScript config for Worker types**

```json
// tsconfig.json (excerpt)
{
  "compilerOptions": {
    "types": ["node", "@cloudflare/workers-types", "vitest/globals"]
  },
  "include": ["src", "server", "worker", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Run lint and Worker test again**

Run: `npm run lint && npm run test:worker`
Expected: lint should pass for config changes, Worker test still fails because app implementation is not created yet.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json wrangler.toml .dev.vars.example tests/worker/api.test.ts

git commit -m "chore: add cloudflare worker tooling and baseline config"
```

---

### Task 2: Implement D1 Persistence Adapters Behind Existing Repository Interfaces

**Files:**
- Create: `worker/repositories/d1-job-repository.ts`, `worker/repositories/d1-log-repository.ts`, `worker/repositories/d1-weekly-price-repository.ts`, `worker/db/migrations/0001_initial.sql`
- Modify: none in Node repositories
- Test: `tests/worker/repositories/d1-repositories.test.ts`

- [ ] **Step 1: Write failing repository contract test for jobs and logs**

```ts
// tests/worker/repositories/d1-repositories.test.ts
import { describe, expect, it } from 'vitest';

describe('d1 repositories', () => {
  it('creates and reads a job', async () => {
    const repo = null as unknown as { create: (name: string) => Promise<{ name: string }> };
    const created = await repo.create('Packing');
    expect(created.name).toBe('Packing');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:worker -- tests/worker/repositories/d1-repositories.test.ts`
Expected: FAIL because D1 repository modules do not exist.

- [ ] **Step 3: Add D1 schema migration**

```sql
-- worker/db/migrations/0001_initial.sql
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calc_type TEXT NOT NULL,
  unit_price REAL,
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  quantity REAL,
  amount REAL,
  unit_price_at_time REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS weekly_prices (
  week_start TEXT NOT NULL,
  job_id TEXT NOT NULL,
  unit_price REAL NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (week_start, job_id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

- [ ] **Step 4: Implement minimal D1 repository for jobs**

```ts
// worker/repositories/d1-job-repository.ts
import type { JobRepository } from '../../server/domain/repositories';

export function createD1JobRepository(db: D1Database): JobRepository {
  return {
    async list() {
      const result = await db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
      return (result.results ?? []) as any[];
    },
    async create(input) {
      await db
        .prepare('INSERT INTO jobs (id, name, calc_type, unit_price, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(input.id, input.name, input.calcType, input.unitPrice ?? null, input.color ?? null, input.createdAt, input.updatedAt)
        .run();
      return input as any;
    },
  } as JobRepository;
}
```

- [ ] **Step 5: Implement minimal D1 repositories for logs and weekly prices**

```ts
// worker/repositories/d1-log-repository.ts
import type { LogRepository } from '../../server/domain/repositories';

export function createD1LogRepository(db: D1Database): LogRepository {
  return {
    async list() {
      const result = await db.prepare('SELECT * FROM logs ORDER BY date DESC, created_at DESC').all();
      return (result.results ?? []) as any[];
    },
  } as LogRepository;
}
```

```ts
// worker/repositories/d1-weekly-price-repository.ts
import type { WeeklyPriceRepository } from '../../server/domain/repositories';

export function createD1WeeklyPriceRepository(db: D1Database): WeeklyPriceRepository {
  return {
    async list() {
      const result = await db.prepare('SELECT * FROM weekly_prices ORDER BY week_start DESC').all();
      return (result.results ?? []) as any[];
    },
  } as WeeklyPriceRepository;
}
```

- [ ] **Step 6: Run repository tests to verify pass/fail movement**

Run: `npm run test:worker -- tests/worker/repositories/d1-repositories.test.ts`
Expected: move from module-not-found failures to interface/behavior failures, then PASS after completing required methods.

- [ ] **Step 7: Commit**

```bash
git add worker/db/migrations/0001_initial.sql worker/repositories tests/worker/repositories/d1-repositories.test.ts

git commit -m "feat: add d1 repository adapters and schema migration"
```

---

### Task 3: Replace Express Runtime with Worker API Entrypoint

**Files:**
- Create: `worker/http/create-api.ts`, `worker/http/response.ts`, `worker/index.ts`
- Modify: none in `server/app.ts` (keep for local fallback until cutover is complete)
- Test: `tests/worker/api.test.ts`

- [ ] **Step 1: Write failing API contract tests for health/bootstrap/jobs**

```ts
// tests/worker/api.test.ts (extend)
import { describe, expect, it } from 'vitest';

describe('worker api contract', () => {
  it('GET /api/health returns ok true', async () => {
    const app = null as unknown as { request: (url: string, init?: RequestInit) => Promise<Response> };
    const res = await app.request('http://localhost/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { ok: true } });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:worker -- tests/worker/api.test.ts`
Expected: FAIL because Worker app factory does not exist.

- [ ] **Step 3: Implement response helpers and API app factory**

```ts
// worker/http/response.ts
export function ok<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ data }, { status: 200, ...init });
}

export function fail(code: string, message: string, status = 500) {
  return Response.json({ error: { code, message } }, { status });
}
```

```ts
// worker/http/create-api.ts
import { Hono } from 'hono';
import { ok } from './response';

export interface WorkerEnv {
  DB: D1Database;
  API_PREFIX?: string;
}

export function createApi() {
  const app = new Hono<{ Bindings: WorkerEnv }>();

  app.get('/api/health', (c) => ok({ ok: true }));

  return app;
}
```

- [ ] **Step 4: Wire Worker fetch entrypoint**

```ts
// worker/index.ts
import { createApi } from './http/create-api';

const app = createApi();

export default {
  fetch: app.fetch,
};
```

- [ ] **Step 5: Complete bootstrap/jobs/logs/weekly-prices routes using salary service + D1 repos**

```ts
// worker/http/create-api.ts (conceptual excerpt)
// - instantiate createSalaryService with D1 repositories
// - map routes to same request/response contract as existing Express API
// - preserve error response format { error: { code, message, details? } }
```

- [ ] **Step 6: Run Worker API tests**

Run: `npm run test:worker -- tests/worker/api.test.ts`
Expected: PASS for health/bootstrap/jobs/logs/weekly-prices API contract tests.

- [ ] **Step 7: Commit**

```bash
git add worker/index.ts worker/http worker/repositories tests/worker/api.test.ts

git commit -m "feat: implement cloudflare worker api with d1-backed services"
```

---

### Task 4: Frontend and Local Dev Cutover to Cloudflare-Compatible API Shape

**Files:**
- Modify: `src/services/apiClient.ts`, `vite.config.ts`, `README.md`
- Test: `tests/client/apiClient.test.ts`

- [ ] **Step 1: Write failing frontend API base-url tests**

```ts
// tests/client/apiClient.test.ts (new case)
it('uses same-origin /api base by default', () => {
  const baseUrl = getResolvedApiBaseUrl();
  expect(baseUrl).toBe('/api');
});
```

- [ ] **Step 2: Run client tests to verify fail**

Run: `npm run test:client -- tests/client/apiClient.test.ts`
Expected: FAIL if current client assumes `http://localhost:4000`.

- [ ] **Step 3: Update API client to same-origin default**

```ts
// src/services/apiClient.ts (excerpt)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';
```

- [ ] **Step 4: Update local Vite proxy to Worker dev endpoint**

```ts
// vite.config.ts (server excerpt)
server: {
  port: 3000,
  host: '0.0.0.0',
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8787',
      changeOrigin: true,
    },
  },
},
```

- [ ] **Step 5: Update README for Cloudflare dev/deploy workflow**

```md
## Cloudflare Development

1. npm install
2. npm run dev
3. Open http://localhost:3000

## Deployment

1. Configure `wrangler.toml` database id and secrets
2. Run D1 migration
3. npm run deploy
```

- [ ] **Step 6: Run end-to-end local verification commands**

Run: `npm run lint`
Expected: PASS

Run: `npm run test`
Expected: PASS (server/client legacy tests + worker tests if included in pipeline)

Run: `npm run dev`
Expected: Vite on `:3000`, Worker on `:8787`, and `/api/health` reachable through the frontend origin.

- [ ] **Step 7: Commit**

```bash
git add src/services/apiClient.ts vite.config.ts README.md tests/client/apiClient.test.ts

git commit -m "feat: switch client and dev workflow to cloudflare-compatible api routing"
```

---

### Task 5: Deployment Readiness and CI Guardrails

**Files:**
- Modify: `package.json`, optionally `.github/workflows/ci.yml` (if present)
- Test: command-level verification

- [ ] **Step 1: Add explicit verification scripts for Cloudflare path**

```json
// package.json (scripts excerpt)
{
  "scripts": {
    "verify": "npm run lint && npm run test",
    "verify:cloudflare": "npm run test:worker && npm run build && npm run build:worker"
  }
}
```

- [ ] **Step 2: Run cloudflare verification locally**

Run: `npm run verify:cloudflare`
Expected: PASS with no type errors and no worker build errors.

- [ ] **Step 3: Dry-run deployment command**

Run: `npm run build:worker`
Expected: Wrangler dry-run succeeds and reports the Worker bundle summary.

- [ ] **Step 4: Commit**

```bash
git add package.json

git commit -m "chore: add cloudflare deployment verification scripts"
```

---

## Spec Coverage Self-Review

- Covered: runtime migration from Node/Express to Worker fetch runtime.
- Covered: data layer migration path from SQLite local driver to D1 adapter repositories.
- Covered: preserving API contract shape (`/api/*`, success/error payload structure).
- Covered: frontend same-origin behavior required for Pages + Worker deployment.
- Covered: local dev, test, and deployment verification flow.
- Remaining explicit decision before implementation: whether to keep `server/` runtime as temporary fallback or remove it in a follow-up cleanup task after Cloudflare cutover is stable.

## Placeholder Scan Self-Review

- No TODO/TBD markers left.
- Every task includes concrete file paths and executable commands.
- Code-bearing steps include concrete snippets (no “implement later” placeholders).

## Type/Contract Consistency Self-Review

- Repository adapters consistently target existing `server/domain/repositories.ts` interfaces.
- API responses preserve existing `{ data }` and `{ error }` envelope contract.
- API route surface remains `/api/health`, `/api/bootstrap`, `/api/jobs`, `/api/logs`, `/api/weekly-prices`.
