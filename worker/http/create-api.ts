import { Hono } from 'hono';
import { AppError } from '../../server/http/error';
import { assertValidJobPayload, assertValidLogPayload, assertValidWeeklyPricePayload } from '../../server/http/validate';
import { createSalaryService } from '../../server/services/salary-service';
import { createD1JobRepository } from '../repositories/d1-job-repository';
import { createD1LogRepository } from '../repositories/d1-log-repository';
import { createD1WeeklyPriceRepository } from '../repositories/d1-weekly-price-repository';
import { fail, fromAppError, ok } from './response';

export interface WorkerEnv {
  DB: D1Database;
}

async function readJsonBody(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return await c.req.json();
  } catch {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid JSON body');
  }
}

function makeService(db: D1Database) {
  return createSalaryService({
    jobRepo: createD1JobRepository(db),
    logRepo: createD1LogRepository(db),
    weeklyPriceRepo: createD1WeeklyPriceRepository(db),
  });
}

export function createApi() {
  const app = new Hono<{ Bindings: WorkerEnv }>();

  // ── health ────────────────────────────────────────────────────────────────

  app.get('/api/health', (c) => ok({ ok: true }));

  // ── bootstrap ─────────────────────────────────────────────────────────────

  app.get('/api/bootstrap', async (c) => {
    const data = await makeService(c.env.DB).getBootstrapData();
    return ok(data);
  });

  // ── jobs ──────────────────────────────────────────────────────────────────

  app.get('/api/jobs', async (c) => {
    return ok(await makeService(c.env.DB).listJobs());
  });

  app.post('/api/jobs', async (c) => {
    const body = await readJsonBody(c);
    assertValidJobPayload(body);
    const created = await makeService(c.env.DB).createJob(body);
    return ok(created, { status: 201 });
  });

  app.put('/api/jobs/:id', async (c) => {
    const body = await readJsonBody(c);
    assertValidJobPayload(body);
    const id = c.req.param('id');
    if (body.id !== id) {
      return fail('VALIDATION_ERROR', 'Path id and body id must match', 400, {
        pathId: id,
        bodyId: body.id,
      });
    }
    const updated = await makeService(c.env.DB).updateJob(id, body);
    return ok(updated);
  });

  app.delete('/api/jobs/:id', async (c) => {
    await makeService(c.env.DB).deleteJob(c.req.param('id'));
    return new Response(null, { status: 204 });
  });

  // ── logs ──────────────────────────────────────────────────────────────────

  app.get('/api/logs', async (c) => {
    return ok(await makeService(c.env.DB).listLogs());
  });

  app.post('/api/logs', async (c) => {
    const body = await readJsonBody(c);
    assertValidLogPayload(body);
    const created = await makeService(c.env.DB).createLog(body);
    return ok(created, { status: 201 });
  });

  app.put('/api/logs/:id', async (c) => {
    const body = await readJsonBody(c);
    assertValidLogPayload(body);
    const id = c.req.param('id');
    if (body.id !== id) {
      return fail('VALIDATION_ERROR', 'Path id and body id must match', 400, {
        pathId: id,
        bodyId: body.id,
      });
    }
    const updated = await makeService(c.env.DB).updateLog(id, body);
    return ok(updated);
  });

  app.delete('/api/logs/:id', async (c) => {
    await makeService(c.env.DB).deleteLog(c.req.param('id'));
    return new Response(null, { status: 204 });
  });

  // ── weekly prices ─────────────────────────────────────────────────────────

  app.put('/api/weekly-prices/:weekStart', async (c) => {
    const body = await readJsonBody(c);
    assertValidWeeklyPricePayload(body);
    await makeService(c.env.DB).setWeeklyPrice(c.req.param('weekStart'), body.jobId, body.unitPrice);
    return new Response(null, { status: 204 });
  });

  // ── error handler ─────────────────────────────────────────────────────────

  app.onError((err, _c) => {
    if (err instanceof AppError) {
      return fromAppError(err);
    }
    return fail('INTERNAL_ERROR', 'Internal Server Error', 500);
  });

  return app;
}
