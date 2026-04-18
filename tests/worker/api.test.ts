import { describe, expect, it } from 'vitest';
import { createApi } from '../../worker/http/create-api';
import { FakeD1Database } from './fake-d1';

describe('worker api contract', () => {
  const app = createApi();

  /** Create a fresh isolated DB + env for each test that mutates state. */
  function freshEnv() {
    return { DB: new FakeD1Database() as unknown as D1Database };
  }

  async function apiRequest(method: string, path: string, body?: unknown, env = freshEnv()) {
    const init: RequestInit = { method };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers = { 'Content-Type': 'application/json' };
    }
    return app.request(path, init, env);
  }

  // ── health ───────────────────────────────────────────────────────────────

  it('GET /api/health → 200 { data: { ok: true } }', async () => {
    const res = await apiRequest('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { ok: true } });
  });

  // ── bootstrap ────────────────────────────────────────────────────────────

  it('GET /api/bootstrap → 200 with empty data shape', async () => {
    const res = await apiRequest('GET', '/api/bootstrap');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { jobs: unknown[]; logs: unknown[]; weeklyPrices: Record<string, unknown> } };
    expect(body.data.jobs).toEqual([]);
    expect(body.data.logs).toEqual([]);
    expect(body.data.weeklyPrices).toEqual({});
  });

  it('GET /api/bootstrap → includes created job and weekly price', async () => {
    const env = freshEnv();
    const job = { id: 'jb1', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' };
    await apiRequest('POST', '/api/jobs', job, env);
    await apiRequest('PUT', '/api/weekly-prices/2026-04-14', { jobId: 'jb1', unitPrice: 12 }, env);

    const res = await apiRequest('GET', '/api/bootstrap', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { jobs: typeof job[]; weeklyPrices: Record<string, Record<string, number>> } };
    expect(body.data.jobs).toEqual([job]);
    expect(body.data.weeklyPrices['2026-04-14']['jb1']).toBe(12);
  });

  // ── jobs ─────────────────────────────────────────────────────────────────

  it('GET /api/jobs → 200 with empty list', async () => {
    const res = await apiRequest('GET', '/api/jobs');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [] });
  });

  it('POST /api/jobs → 201 with created job', async () => {
    const job = { id: 'j1', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' };
    const res = await apiRequest('POST', '/api/jobs', job);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: job });
  });

  it('PUT /api/jobs/:id → 200 with updated job', async () => {
    const env = freshEnv();
    const job = { id: 'j2', name: 'Sorting', calcType: 'HOURLY', unitPrice: 15, color: '#00ff00' };
    await apiRequest('POST', '/api/jobs', job, env);
    const updated = { ...job, name: 'Sorting Updated' };
    const res = await apiRequest('PUT', '/api/jobs/j2', updated, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: updated });
  });

  it('DELETE /api/jobs/:id → 204', async () => {
    const env = freshEnv();
    const job = { id: 'j3', name: 'Delivery', calcType: 'FIXED', unitPrice: 50, color: '#0000ff' };
    await apiRequest('POST', '/api/jobs', job, env);
    const res = await apiRequest('DELETE', '/api/jobs/j3', undefined, env);
    expect(res.status).toBe(204);
  });

  // ── logs ─────────────────────────────────────────────────────────────────

  it('GET /api/logs → 200 with empty list', async () => {
    const res = await apiRequest('GET', '/api/logs');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [] });
  });

  it('POST /api/logs → 201 with created log', async () => {
    const env = freshEnv();
    await apiRequest('POST', '/api/jobs', { id: 'j4', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' }, env);
    const log = { id: 'l1', jobId: 'j4', date: '2026-04-18', amount: 100, unitPriceAtTime: 10 };
    const res = await apiRequest('POST', '/api/logs', log, env);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: log });
  });

  it('PUT /api/logs/:id → 200 with updated log', async () => {
    const env = freshEnv();
    await apiRequest('POST', '/api/jobs', { id: 'j5', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' }, env);
    const log = { id: 'l2', jobId: 'j5', date: '2026-04-18', amount: 100, unitPriceAtTime: 10 };
    await apiRequest('POST', '/api/logs', log, env);
    const updated = { ...log, amount: 200 };
    const res = await apiRequest('PUT', '/api/logs/l2', updated, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: updated });
  });

  it('DELETE /api/logs/:id → 204', async () => {
    const env = freshEnv();
    await apiRequest('POST', '/api/jobs', { id: 'j6', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' }, env);
    const log = { id: 'l3', jobId: 'j6', date: '2026-04-18', amount: 100, unitPriceAtTime: 10 };
    await apiRequest('POST', '/api/logs', log, env);
    const res = await apiRequest('DELETE', '/api/logs/l3', undefined, env);
    expect(res.status).toBe(204);
  });

  // ── weekly prices ─────────────────────────────────────────────────────────

  it('PUT /api/weekly-prices/:weekStart → 204', async () => {
    const env = freshEnv();
    await apiRequest('POST', '/api/jobs', { id: 'j7', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' }, env);
    const res = await apiRequest('PUT', '/api/weekly-prices/2026-04-14', { jobId: 'j7', unitPrice: 12 }, env);
    expect(res.status).toBe(204);
  });

  // ── error envelope ────────────────────────────────────────────────────────

  it('POST /api/jobs with invalid payload → 400 with VALIDATION_ERROR envelope', async () => {
    const res = await apiRequest('POST', '/api/jobs', { name: 'Missing required fields' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof body.error.message).toBe('string');
  });

  it('PUT /api/jobs/:id with mismatched body id → 400 with VALIDATION_ERROR envelope', async () => {
    const env = freshEnv();
    await apiRequest('POST', '/api/jobs', { id: 'j8', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' }, env);
    const res = await apiRequest(
      'PUT',
      '/api/jobs/j8',
      { id: 'different-id', name: 'Packing', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' },
      env,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/logs with invalid payload → 400 with VALIDATION_ERROR envelope', async () => {
    const res = await apiRequest('POST', '/api/logs', { jobId: 'missing-other-fields' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/jobs with malformed JSON → 400 with VALIDATION_ERROR envelope', async () => {
    const res = await app.request(
      '/api/jobs',
      {
        method: 'POST',
        body: '{"id":"j9",',
        headers: { 'Content-Type': 'application/json' },
      },
      freshEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Invalid JSON body');
  });
});
