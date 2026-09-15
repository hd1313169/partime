import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError } from '../../server/http/error';
import { assertValidJobPayload, assertValidLogPayload, assertValidWeeklyPricePayload } from '../../server/http/validate';
import { createSalaryService } from '../../server/services/salary-service';
import { createD1JobRepository } from '../repositories/d1-job-repository';
import { createD1LogRepository } from '../repositories/d1-log-repository';
import { createD1WeeklyPriceRepository } from '../repositories/d1-weekly-price-repository';
import { fail, fromAppError, ok } from './response';

export interface WorkerEnv {
  DB: D1Database;
  APP_SECRET?: string;
  ALLOWED_ORIGINS?: string;
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

  // Allow only explicitly configured frontend origins to call Worker APIs cross-origin.
  app.use(
    '/api/*',
    cors({
      origin: (origin, c) => {
        const allowed = (c.env.ALLOWED_ORIGINS ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        return allowed.includes(origin) ? origin : undefined;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'X-App-Secret'],
      maxAge: 86400,
    }),
  );

  // Require a shared secret on every request except the health check.
  // Fails closed: a missing APP_SECRET binding rejects all protected requests
  // rather than treating an unconfigured secret as "no auth required".
  app.use('/api/*', async (c, next) => {
    if (c.req.path === '/api/health') {
      return next();
    }

    const provided = c.req.header('X-App-Secret');
    if (!c.env.APP_SECRET || provided !== c.env.APP_SECRET) {
      return fail('UNAUTHORIZED', 'Unauthorized', 401);
    }

    return next();
  });

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
    console.error('API Error:', err);
    if (err instanceof AppError) {
      return fromAppError(err);
    }
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return fail('INTERNAL_ERROR', 'Internal Server Error', 500, { message, stack });
  });

  return app;
}
