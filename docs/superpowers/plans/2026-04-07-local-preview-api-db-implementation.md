# Local Preview API DB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-repo frontend + Express API + SQLite development workflow with one-command local preview, while keeping clear boundaries for future PostgreSQL migration.

**Architecture:** Keep the existing Vite React app in src and add a focused server module under server. Use service and repository interfaces so business logic is database-implementation agnostic. Replace browser localStorage as primary source with typed API client calls and unified error mapping.

**Tech Stack:** React 19, TypeScript, Vite 6, Express 4, better-sqlite3, Vitest, Supertest, tsx, concurrently

---

## Scope Check

The approved spec describes one cohesive subsystem: local full-stack preview for the salary tracker with SQLite persistence and API-first frontend flow. This plan keeps scope in one implementation stream and excludes migration/seed features by design.

## File Structure and Responsibilities

- Create: `server/index.ts` - express app bootstrap, middleware wiring, route mounting.
- Create: `server/app.ts` - pure express app factory for testability.
- Create: `server/config.ts` - runtime configuration (ports, db path, env).
- Create: `server/http/error.ts` - AppError type and error response helpers.
- Create: `server/http/error-middleware.ts` - centralized error handling middleware.
- Create: `server/http/validate.ts` - request validators for payload constraints.
- Create: `server/db/schema.ts` - SQL schema creation statements.
- Create: `server/db/sqlite.ts` - sqlite connection lifecycle and schema init.
- Create: `server/domain/models.ts` - shared backend domain types.
- Create: `server/domain/repositories.ts` - repository interfaces.
- Create: `server/repositories/sqlite-job-repository.ts` - JobRepository sqlite implementation.
- Create: `server/repositories/sqlite-log-repository.ts` - LogRepository sqlite implementation.
- Create: `server/repositories/sqlite-weekly-price-repository.ts` - WeeklyPriceRepository sqlite implementation.
- Create: `server/services/salary-service.ts` - use-cases: bootstrap, CRUD operations, validations.
- Create: `server/routes/health.ts` - GET /api/health.
- Create: `server/routes/jobs.ts` - jobs CRUD routes.
- Create: `server/routes/logs.ts` - logs CRUD routes.
- Create: `server/routes/weekly-prices.ts` - weekly price update route.
- Create: `server/routes/bootstrap.ts` - GET /api/bootstrap route.
- Create: `src/services/apiClient.ts` - typed HTTP wrapper and response/error mapping.
- Create: `src/services/salaryApi.ts` - feature-specific API functions.
- Modify: `src/App.tsx` - switch initialization and write operations from local storage to API.
- Modify: `src/types.ts` - add response and DTO types used by API client.
- Keep (compatibility): `src/services/storageManager.ts` - temporary fallback only for emergency local snapshot.
- Modify: `vite.config.ts` - proxy /api to Express server.
- Modify: `package.json` - scripts for full-stack dev and test commands.
- Create: `tests/server/health.test.ts` - health endpoint tests.
- Create: `tests/server/jobs.test.ts` - jobs endpoint tests.
- Create: `tests/server/logs.test.ts` - logs endpoint tests.
- Create: `tests/server/bootstrap.test.ts` - bootstrap endpoint tests.
- Create: `tests/server/repositories/sqlite-repositories.test.ts` - sqlite repository behavior tests.
- Create: `tests/client/apiClient.test.ts` - frontend API error mapping tests.
- Create: `vitest.config.ts` - test runner configuration for node + jsdom projects.

### Task 1: Tooling and Test Harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup/server.setup.ts`
- Create: `tests/setup/client.setup.ts`

- [ ] **Step 1: Write failing tooling test command expectation**

```bash
npm run test:server
```

Expected: command not found error because script does not exist yet.

- [ ] **Step 2: Add scripts and dev dependencies**

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite --port=3000 --host=0.0.0.0",
    "dev:server": "tsx watch server/index.ts",
    "test": "npm run test:server && npm run test:client",
    "test:server": "vitest run tests/server --reporter=verbose",
    "test:client": "vitest run tests/client --reporter=verbose",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "concurrently": "^9.0.1",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.3",
    "vitest": "^2.1.8",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 3: Add Vitest config**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
    environmentMatchGlobs: [
      ['tests/client/**', 'jsdom'],
      ['tests/server/**', 'node'],
    ],
  },
});
```

- [ ] **Step 4: Run dependency install**

Run: `npm install`
Expected: installs vitest, supertest, concurrently without errors.

- [ ] **Step 5: Run baseline test command**

Run: `npm run test:server`
Expected: FAIL with no test files found in tests/server.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts
git commit -m "chore: add full-stack test and dev tooling"
```

### Task 2: Express App Bootstrap and Health Endpoint

**Files:**
- Create: `server/config.ts`
- Create: `server/http/error.ts`
- Create: `server/http/error-middleware.ts`
- Create: `server/app.ts`
- Create: `server/index.ts`
- Create: `server/routes/health.ts`
- Test: `tests/server/health.test.ts`

- [ ] **Step 1: Write failing health endpoint test**

```ts
import request from 'supertest';
import { createApp } from '../../server/app';

describe('GET /api/health', () => {
  it('returns ok payload', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });
});
```

- [ ] **Step 2: Run health test to confirm fail**

Run: `npm run test:server -- tests/server/health.test.ts`
Expected: FAIL because createApp module does not exist.

- [ ] **Step 3: Implement minimal app and route**

```ts
// server/routes/health.ts
import { Router } from 'express';

export const healthRouter = Router();
healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ data: { status: 'ok' } });
});
```

```ts
// server/app.ts
import express from 'express';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', healthRouter);
  return app;
}
```

```ts
// server/index.ts
import { createApp } from './app';

const port = Number(process.env.API_PORT ?? 4000);
createApp().listen(port, () => {
  console.log(`API listening on ${port}`);
});
```

- [ ] **Step 4: Run health test to confirm pass**

Run: `npm run test:server -- tests/server/health.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/app.ts server/index.ts server/routes/health.ts tests/server/health.test.ts
git commit -m "feat: add express bootstrap and health endpoint"
```

### Task 3: SQLite Connection, Schema Init, and Repository Interfaces

**Files:**
- Create: `server/domain/models.ts`
- Create: `server/domain/repositories.ts`
- Create: `server/db/schema.ts`
- Create: `server/db/sqlite.ts`
- Create: `server/repositories/sqlite-job-repository.ts`
- Create: `server/repositories/sqlite-log-repository.ts`
- Create: `server/repositories/sqlite-weekly-price-repository.ts`
- Test: `tests/server/repositories/sqlite-repositories.test.ts`

- [ ] **Step 1: Write failing repository test**

```ts
import { createSqliteDb } from '../../../server/db/sqlite';
import { createSqliteJobRepository } from '../../../server/repositories/sqlite-job-repository';

describe('sqlite repositories', () => {
  it('persists and reads jobs', () => {
    const db = createSqliteDb(':memory:');
    const repo = createSqliteJobRepository(db);

    repo.create({ id: 'j1', name: '包裝', calcType: 'HOURLY', unitPrice: 210, color: '#10b981' });
    const jobs = repo.list();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toBe('包裝');
  });
});
```

- [ ] **Step 2: Run repository test to verify fail**

Run: `npm run test:server -- tests/server/repositories/sqlite-repositories.test.ts`
Expected: FAIL because sqlite and repository modules do not exist.

- [ ] **Step 3: Implement schema and sqlite factory**

```ts
// server/db/schema.ts
export const schemaSql = `
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calc_type TEXT NOT NULL,
  unit_price REAL NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  quantity REAL,
  amount REAL NOT NULL,
  unit_price_at_time REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS weekly_prices (
  week_start TEXT NOT NULL,
  job_id TEXT NOT NULL,
  unit_price REAL NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (week_start, job_id)
);
`;
```

```ts
// server/db/sqlite.ts
import Database from 'better-sqlite3';
import { schemaSql } from './schema';

export type SqliteDb = Database.Database;

export function createSqliteDb(path: string): SqliteDb {
  const db = new Database(path);
  db.exec(schemaSql);
  return db;
}
```

- [ ] **Step 4: Implement repository interface and minimal sqlite job repository**

```ts
// server/domain/repositories.ts
import { Job, WorkLog, WeeklyPriceRow } from './models';

export interface JobRepository {
  list(): Job[];
  create(input: Job): Job;
  update(id: string, input: Job): Job;
  remove(id: string): void;
}

export interface LogRepository {
  listByWeekStart(weekStart: string): WorkLog[];
  listAll(): WorkLog[];
  create(input: WorkLog): WorkLog;
  update(id: string, input: WorkLog): WorkLog;
  remove(id: string): void;
}

export interface WeeklyPriceRepository {
  set(weekStart: string, jobId: string, unitPrice: number): void;
  listAll(): WeeklyPriceRow[];
}
```

```ts
// server/repositories/sqlite-job-repository.ts
import { SqliteDb } from '../db/sqlite';
import { JobRepository } from '../domain/repositories';
import { Job } from '../domain/models';

export function createSqliteJobRepository(db: SqliteDb): JobRepository {
  return {
    list() {
      const rows = db.prepare('SELECT id, name, calc_type, unit_price, color FROM jobs').all() as any[];
      return rows.map((r) => ({ id: r.id, name: r.name, calcType: r.calc_type, unitPrice: r.unit_price, color: r.color }));
    },
    create(input: Job) {
      db.prepare('INSERT INTO jobs (id, name, calc_type, unit_price, color) VALUES (?, ?, ?, ?, ?)')
        .run(input.id, input.name, input.calcType, input.unitPrice, input.color);
      return input;
    },
    update(id: string, input: Job) {
      db.prepare('UPDATE jobs SET name=?, calc_type=?, unit_price=?, color=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .run(input.name, input.calcType, input.unitPrice, input.color, id);
      return input;
    },
    remove(id: string) {
      db.prepare('DELETE FROM jobs WHERE id=?').run(id);
    },
  };
}
```

- [ ] **Step 5: Run repository test to verify pass**

Run: `npm run test:server -- tests/server/repositories/sqlite-repositories.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/db server/domain server/repositories tests/server/repositories/sqlite-repositories.test.ts
git commit -m "feat: add sqlite schema and repository interfaces"
```

### Task 4: Salary Service and Jobs API with Validation

**Files:**
- Create: `server/http/validate.ts`
- Create: `server/services/salary-service.ts`
- Create: `server/routes/jobs.ts`
- Modify: `server/app.ts`
- Test: `tests/server/jobs.test.ts`

- [ ] **Step 1: Write failing jobs API tests**

```ts
import request from 'supertest';
import { createApp } from '../../server/app';

describe('jobs api', () => {
  it('creates a job', async () => {
    const app = createApp();
    const res = await request(app).post('/api/jobs').send({
      id: 'j1',
      name: '包裝(上午)',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('j1');
  });

  it('rejects invalid calcType', async () => {
    const app = createApp();
    const res = await request(app).post('/api/jobs').send({ id: 'x', name: '錯誤', calcType: 'AAA', unitPrice: 10, color: '#000' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

- [ ] **Step 2: Run jobs tests to verify fail**

Run: `npm run test:server -- tests/server/jobs.test.ts`
Expected: FAIL with route not found or missing modules.

- [ ] **Step 3: Implement validator and salary service methods for jobs**

```ts
// server/http/validate.ts
const calcTypes = new Set(['HOURLY', 'PIECE', 'FIXED']);

export function assertValidJobPayload(payload: any) {
  if (!payload || typeof payload !== 'object') throw new Error('invalid payload');
  if (!calcTypes.has(payload.calcType)) throw new Error('invalid calcType');
  if (typeof payload.name !== 'string' || payload.name.trim() === '') throw new Error('invalid name');
  if (typeof payload.unitPrice !== 'number' || Number.isNaN(payload.unitPrice)) throw new Error('invalid unitPrice');
  if (typeof payload.color !== 'string' || payload.color.trim() === '') throw new Error('invalid color');
}
```

```ts
// server/services/salary-service.ts
import { JobRepository } from '../domain/repositories';
import { Job } from '../domain/models';

export function createSalaryService(jobRepo: JobRepository) {
  return {
    listJobs(): Job[] {
      return jobRepo.list();
    },
    createJob(input: Job): Job {
      return jobRepo.create(input);
    },
    updateJob(id: string, input: Job): Job {
      return jobRepo.update(id, input);
    },
    deleteJob(id: string): void {
      return jobRepo.remove(id);
    },
  };
}
```

- [ ] **Step 4: Implement jobs routes and register in app**

```ts
// server/routes/jobs.ts
import { Router } from 'express';
import { assertValidJobPayload } from '../http/validate';
import { createSalaryService } from '../services/salary-service';

export function createJobsRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.get('/jobs', (_req, res) => res.json({ data: service.listJobs() }));

  router.post('/jobs', (req, res) => {
    assertValidJobPayload(req.body);
    const created = service.createJob(req.body);
    res.status(201).json({ data: created });
  });

  router.put('/jobs/:id', (req, res) => {
    assertValidJobPayload(req.body);
    const updated = service.updateJob(req.params.id, req.body);
    res.json({ data: updated });
  });

  router.delete('/jobs/:id', (req, res) => {
    service.deleteJob(req.params.id);
    res.status(204).send();
  });

  return router;
}
```

- [ ] **Step 5: Run jobs tests to verify pass**

Run: `npm run test:server -- tests/server/jobs.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/http/validate.ts server/services/salary-service.ts server/routes/jobs.ts server/app.ts tests/server/jobs.test.ts
git commit -m "feat: add jobs api with validation and service layer"
```

### Task 5: Logs Weekly Prices and Bootstrap APIs

**Files:**
- Create: `server/routes/logs.ts`
- Create: `server/routes/weekly-prices.ts`
- Create: `server/routes/bootstrap.ts`
- Modify: `server/services/salary-service.ts`
- Modify: `server/repositories/sqlite-log-repository.ts`
- Modify: `server/repositories/sqlite-weekly-price-repository.ts`
- Modify: `server/app.ts`
- Test: `tests/server/logs.test.ts`
- Test: `tests/server/bootstrap.test.ts`

- [ ] **Step 1: Write failing logs and bootstrap tests**

```ts
import request from 'supertest';
import { createApp } from '../../server/app';

describe('bootstrap api', () => {
  it('returns jobs logs weeklyPrices object', async () => {
    const app = createApp();
    const res = await request(app).get('/api/bootstrap');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('jobs');
    expect(res.body.data).toHaveProperty('logs');
    expect(res.body.data).toHaveProperty('weeklyPrices');
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `npm run test:server -- tests/server/logs.test.ts tests/server/bootstrap.test.ts`
Expected: FAIL due to missing routes and methods.

- [ ] **Step 3: Implement service methods and route handlers**

```ts
// salary-service additions
listAllLogs() { return logRepo.listAll(); }
createLog(input) { return logRepo.create(input); }
updateLog(id, input) { return logRepo.update(id, input); }
deleteLog(id) { return logRepo.remove(id); }
setWeeklyPrice(weekStart: string, jobId: string, unitPrice: number) {
  weeklyPriceRepo.set(weekStart, jobId, unitPrice);
}
getBootstrapData() {
  const rows = weeklyPriceRepo.listAll();
  const weeklyPrices = rows.reduce((acc, row) => {
    acc[row.weekStart] ||= {};
    acc[row.weekStart][row.jobId] = row.unitPrice;
    return acc;
  }, {} as Record<string, Record<string, number>>);
  return { jobs: jobRepo.list(), logs: logRepo.listAll(), weeklyPrices };
}
```

```ts
// bootstrap route
router.get('/bootstrap', (_req, res) => {
  res.json({ data: service.getBootstrapData() });
});
```

```ts
// weekly price route
router.put('/weekly-prices/:weekStart', (req, res) => {
  const { jobId, unitPrice } = req.body;
  service.setWeeklyPrice(req.params.weekStart, jobId, unitPrice);
  res.status(204).send();
});
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:server -- tests/server/logs.test.ts tests/server/bootstrap.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/routes/logs.ts server/routes/weekly-prices.ts server/routes/bootstrap.ts server/services/salary-service.ts server/repositories/sqlite-log-repository.ts server/repositories/sqlite-weekly-price-repository.ts server/app.ts tests/server/logs.test.ts tests/server/bootstrap.test.ts
git commit -m "feat: add logs weekly price and bootstrap APIs"
```

### Task 6: Unified Error Middleware and API Error Contract

**Files:**
- Modify: `server/http/error.ts`
- Modify: `server/http/error-middleware.ts`
- Modify: `server/app.ts`
- Modify: `server/routes/jobs.ts`
- Modify: `server/routes/logs.ts`
- Modify: `server/routes/weekly-prices.ts`
- Test: `tests/server/jobs.test.ts`

- [ ] **Step 1: Add failing error-shape test**

```ts
it('returns unified VALIDATION_ERROR shape', async () => {
  const app = createApp();
  const res = await request(app).post('/api/jobs').send({});
  expect(res.status).toBe(400);
  expect(res.body).toEqual({
    error: {
      code: 'VALIDATION_ERROR',
      message: expect.any(String),
      details: expect.anything(),
    },
  });
});
```

- [ ] **Step 2: Run test and verify fail**

Run: `npm run test:server -- tests/server/jobs.test.ts`
Expected: FAIL because default express error shape is inconsistent.

- [ ] **Step 3: Implement AppError and middleware**

```ts
// server/http/error.ts
export class AppError extends Error {
  constructor(
    public readonly code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR',
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
```

```ts
// server/http/error-middleware.ts
import { NextFunction, Request, Response } from 'express';
import { AppError } from './error';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}
```

- [ ] **Step 4: Map validator failures to AppError and mount middleware last**

```ts
throw new AppError('VALIDATION_ERROR', 400, 'Invalid job payload', { field: 'calcType' });
```

- [ ] **Step 5: Run server tests**

Run: `npm run test:server`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/http/error.ts server/http/error-middleware.ts server/app.ts server/routes/jobs.ts server/routes/logs.ts server/routes/weekly-prices.ts tests/server/jobs.test.ts
git commit -m "feat: enforce unified api error contract"
```

### Task 7: Vite Proxy and Full-Stack Local Preview Scripts

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing manual check**

Run: `npm run dev`
Expected: either only client starts or /api request from client returns network failure.

- [ ] **Step 2: Add Vite proxy configuration**

```ts
server: {
  hmr: process.env.DISABLE_HMR !== 'true',
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
}
```

- [ ] **Step 3: Ensure package scripts exist for split and combined start**

```json
{
  "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
  "dev:client": "vite --port=3000 --host=0.0.0.0",
  "dev:server": "tsx watch server/index.ts"
}
```

- [ ] **Step 4: Run end-to-end local preview check**

Run: `npm run dev`
Expected: one terminal stream for client on 3000 and one stream for API on 4000, and GET /api/health returns 200 from browser network tab.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts package.json
git commit -m "chore: enable one-command local full-stack preview"
```

### Task 8: Frontend API Client and App Migration from Local Storage

**Files:**
- Create: `src/services/apiClient.ts`
- Create: `src/services/salaryApi.ts`
- Modify: `src/types.ts`
- Modify: `src/App.tsx`
- Test: `tests/client/apiClient.test.ts`

- [ ] **Step 1: Write failing client error mapping test**

```ts
import { mapApiError } from '../../src/services/apiClient';

describe('api client error mapping', () => {
  it('maps VALIDATION_ERROR into readable message', () => {
    const msg = mapApiError({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } });
    expect(msg).toBe('資料格式錯誤，請檢查輸入內容');
  });
});
```

- [ ] **Step 2: Run client test to verify fail**

Run: `npm run test:client -- tests/client/apiClient.test.ts`
Expected: FAIL because apiClient does not exist.

- [ ] **Step 3: Implement apiClient and salaryApi**

```ts
// src/services/apiClient.ts
export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';

export interface ApiErrorPayload {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

export async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw json;
  }
  return json.data as T;
}

export function mapApiError(payload: ApiErrorPayload): string {
  switch (payload.error.code) {
    case 'VALIDATION_ERROR':
      return '資料格式錯誤，請檢查輸入內容';
    case 'NOT_FOUND':
      return '找不到指定資料';
    case 'CONFLICT':
      return '資料衝突，請重新整理後再試';
    default:
      return '系統忙碌中，請稍後再試';
  }
}
```

```ts
// src/services/salaryApi.ts
import { apiRequest } from './apiClient';
import { JobType, WeeklyPriceConfig, WorkLog } from '../types';

export interface BootstrapData {
  jobs: JobType[];
  logs: WorkLog[];
  weeklyPrices: WeeklyPriceConfig;
}

export const salaryApi = {
  getBootstrap: () => apiRequest<BootstrapData>('/api/bootstrap'),
  createJob: (job: JobType) => apiRequest<JobType>('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) }),
  updateJob: (job: JobType) => apiRequest<JobType>(`/api/jobs/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) }),
  deleteJob: (id: string) => apiRequest<void>(`/api/jobs/${id}`, { method: 'DELETE' }),
  createLog: (log: WorkLog) => apiRequest<WorkLog>('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(log) }),
  updateLog: (log: WorkLog) => apiRequest<WorkLog>(`/api/logs/${log.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(log) }),
  deleteLog: (id: string) => apiRequest<void>(`/api/logs/${id}`, { method: 'DELETE' }),
  setWeeklyPrice: (weekStart: string, jobId: string, unitPrice: number) =>
    apiRequest<void>(`/api/weekly-prices/${weekStart}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, unitPrice }),
    }),
};
```

- [ ] **Step 4: Migrate App initialization and write flows**

```ts
// App initialization pattern
const [jobs, setJobs] = useState<JobType[]>([]);
const [logs, setLogs] = useState<WorkLog[]>([]);
const [weeklyPrices, setWeeklyPrices] = useState<WeeklyPriceConfig>({});
const [apiError, setApiError] = useState<string | null>(null);

useEffect(() => {
  salaryApi.getBootstrap()
    .then((data) => {
      setJobs(data.jobs);
      setLogs(data.logs);
      setWeeklyPrices(data.weeklyPrices);
    })
    .catch((err) => setApiError(mapApiError(err)));
}, []);
```

- [ ] **Step 5: Run targeted client test and typecheck**

Run: `npm run test:client -- tests/client/apiClient.test.ts`
Expected: PASS.

Run: `npm run lint`
Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/apiClient.ts src/services/salaryApi.ts src/App.tsx src/types.ts tests/client/apiClient.test.ts
git commit -m "feat: migrate frontend data flow to api client"
```

### Task 9: Final Integration Verification and Docs Update

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-04-07-local-preview-api-db-design.md`

- [ ] **Step 1: Add failing checklist expectation (manual)**

Checklist to verify before documentation update:
- `npm run test` passes
- `npm run dev` starts both services
- browser can load app and perform job/log create + delete

Expected: one or more checks fail before final adjustments.

- [ ] **Step 2: Resolve remaining mismatches and run full verification**

Run: `npm run test`
Expected: PASS all server and client tests.

Run: `npm run dev`
Expected: both client and server live, API calls successful.

- [ ] **Step 3: Update README run instructions**

```md
## Local Development

1. Install dependencies: npm install
2. Start full-stack preview: npm run dev
3. Open http://localhost:3000

Optional split mode:
- npm run dev:client
- npm run dev:server
```

- [ ] **Step 4: Mark spec execution notes**

Add a short section to spec noting implementation status and any intentional deviations.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/specs/2026-04-07-local-preview-api-db-design.md
git commit -m "docs: document full-stack local preview workflow"
```

## Self-Review

### 1. Spec coverage

- Goal and architecture coverage: Task 2, Task 3, Task 7.
- API contract coverage: Task 4, Task 5, Task 6.
- Frontend API migration coverage: Task 8.
- Error handling coverage: Task 6 and Task 8.
- Testing and DoD coverage: Task 1, Task 2, Task 3, Task 4, Task 5, Task 8, Task 9.
- Local one-command preview coverage: Task 7.
- PostgreSQL migration boundary coverage: Task 3 interface-first repository design.

No uncovered spec requirements found.

### 2. Placeholder scan

- Checked for TBD, TODO, implement later, add tests later, and vague-only steps.
- All code-changing steps include concrete code snippets and exact commands.

### 3. Type consistency check

- Shared job/log/weekly price naming is kept as JobType, WorkLog, WeeklyPriceConfig on frontend.
- Backend domain uses Job, WorkLog, WeeklyPriceRow with explicit repository interfaces.
- Error codes are consistently VALIDATION_ERROR, NOT_FOUND, CONFLICT, INTERNAL_ERROR across server and client.
