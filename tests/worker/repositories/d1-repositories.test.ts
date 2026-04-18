import { describe, expect, it } from 'vitest';

import { createD1JobRepository } from '../../../worker/repositories/d1-job-repository';
import { createD1LogRepository } from '../../../worker/repositories/d1-log-repository';
import { createD1WeeklyPriceRepository } from '../../../worker/repositories/d1-weekly-price-repository';
import type { Job, WorkLog } from '../../../server/domain/models';

interface D1QueryResult {
  success: boolean;
  meta?: Record<string, unknown>;
}

interface D1PreparedLike {
  bind: (...values: unknown[]) => D1PreparedLike;
  run: <T = D1QueryResult>() => Promise<T>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
}

class FakeD1Database {
  private jobs = new Map<string, Job>();
  private logs = new Map<string, WorkLog>();
  private weeklyPrices = new Map<string, { weekStart: string; jobId: string; unitPrice: number }>();

  prepare(query: string): D1PreparedLike {
    const normalized = query.replace(/\s+/g, ' ').trim();
    let args: unknown[] = [];

    const statement: D1PreparedLike = {
      bind: (...values: unknown[]) => {
        args = values;
        return statement;
      },
      run: async <T>() => this.executeRun(normalized, args) as T,
      first: async <T>() => this.executeFirst<T>(normalized, args),
      all: async <T>() => ({ results: this.executeAll<T>(normalized, args) }),
    };

    return statement;
  }

  private executeRun(query: string, args: unknown[]): D1QueryResult {
    if (query.startsWith('INSERT INTO jobs')) {
      const [id, name, calcType, unitPrice, color] = args as [string, string, Job['calcType'], number, string];
      this.jobs.set(id, { id, name, calcType, unitPrice, color });
      return { success: true };
    }

    if (query.startsWith('UPDATE jobs SET')) {
      const [name, calcType, unitPrice, color, id] = args as [string, Job['calcType'], number, string, string];
      if (!this.jobs.has(id)) {
        return { success: false, meta: { changes: 0 } };
      }
      this.jobs.set(id, { id, name, calcType, unitPrice, color });
      return { success: true, meta: { changes: 1 } };
    }

    if (query.startsWith('DELETE FROM jobs')) {
      const [id] = args as [string];
      const existed = this.jobs.delete(id);
      return { success: true, meta: { changes: existed ? 1 : 0 } };
    }

    if (query.startsWith('INSERT INTO logs')) {
      const [id, jobId, date, startTime, endTime, quantity, amount, unitPriceAtTime] = args as [
        string,
        string,
        string,
        string | null,
        string | null,
        number | null,
        number,
        number,
      ];

      if (!this.jobs.has(jobId)) {
        throw new Error('D1_ERROR: FOREIGN KEY constraint failed');
      }

      this.logs.set(id, {
        id,
        jobId,
        date,
        startTime: startTime ?? undefined,
        endTime: endTime ?? undefined,
        quantity: quantity ?? undefined,
        amount,
        unitPriceAtTime,
      });
      return { success: true };
    }

    if (query.startsWith('UPDATE logs SET')) {
      const [jobId, date, startTime, endTime, quantity, amount, unitPriceAtTime, id] = args as [
        string,
        string,
        string | null,
        string | null,
        number | null,
        number,
        number,
        string,
      ];
      if (!this.logs.has(id)) {
        return { success: false, meta: { changes: 0 } };
      }
      this.logs.set(id, {
        id,
        jobId,
        date,
        startTime: startTime ?? undefined,
        endTime: endTime ?? undefined,
        quantity: quantity ?? undefined,
        amount,
        unitPriceAtTime,
      });
      return { success: true, meta: { changes: 1 } };
    }

    if (query.startsWith('DELETE FROM logs')) {
      const [id] = args as [string];
      const existed = this.logs.delete(id);
      return { success: true, meta: { changes: existed ? 1 : 0 } };
    }

    if (query.startsWith('INSERT INTO weekly_prices')) {
      const [weekStart, jobId, unitPrice] = args as [string, string, number];
      if (!this.jobs.has(jobId)) {
        throw new Error('D1_ERROR: FOREIGN KEY constraint failed');
      }
      this.weeklyPrices.set(`${weekStart}:${jobId}`, { weekStart, jobId, unitPrice });
      return { success: true };
    }

    throw new Error(`Unsupported run query: ${query}`);
  }

  private executeFirst<T>(query: string, args: unknown[]): T | null {
    if (query.startsWith('SELECT id, name, calc_type, unit_price, color FROM jobs WHERE id = ?')) {
      const [id] = args as [string];
      const row = this.jobs.get(id);
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        name: row.name,
        calc_type: row.calcType,
        unit_price: row.unitPrice,
        color: row.color,
      } as T;
    }

    if (query.startsWith('SELECT id, job_id, date, start_time, end_time, quantity, amount, unit_price_at_time FROM logs WHERE id = ?')) {
      const [id] = args as [string];
      const row = this.logs.get(id);
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        job_id: row.jobId,
        date: row.date,
        start_time: row.startTime ?? null,
        end_time: row.endTime ?? null,
        quantity: row.quantity ?? null,
        amount: row.amount,
        unit_price_at_time: row.unitPriceAtTime,
      } as T;
    }

    throw new Error(`Unsupported first query: ${query}`);
  }

  private executeAll<T>(query: string, args: unknown[]): T[] {
    if (query.startsWith('SELECT id, name, calc_type, unit_price, color FROM jobs ORDER BY id')) {
      return [...this.jobs.values()]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((row) => ({
          id: row.id,
          name: row.name,
          calc_type: row.calcType,
          unit_price: row.unitPrice,
          color: row.color,
        })) as T[];
    }

    if (
      query.startsWith(
        "SELECT id, job_id, date, start_time, end_time, quantity, amount, unit_price_at_time FROM logs WHERE date >= date(?) AND date <= date(?, '+6 day') ORDER BY date, id",
      )
    ) {
      const [weekStart] = args as [string, string];
      const start = new Date(`${weekStart}T00:00:00.000Z`).getTime();
      const end = start + 6 * 24 * 60 * 60 * 1000;

      return [...this.logs.values()]
        .filter((row) => {
          const value = new Date(`${row.date}T00:00:00.000Z`).getTime();
          return value >= start && value <= end;
        })
        .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)))
        .map((row) => ({
          id: row.id,
          job_id: row.jobId,
          date: row.date,
          start_time: row.startTime ?? null,
          end_time: row.endTime ?? null,
          quantity: row.quantity ?? null,
          amount: row.amount,
          unit_price_at_time: row.unitPriceAtTime,
        })) as T[];
    }

    if (query.startsWith('SELECT id, job_id, date, start_time, end_time, quantity, amount, unit_price_at_time FROM logs ORDER BY date, id')) {
      return [...this.logs.values()]
        .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)))
        .map((row) => ({
          id: row.id,
          job_id: row.jobId,
          date: row.date,
          start_time: row.startTime ?? null,
          end_time: row.endTime ?? null,
          quantity: row.quantity ?? null,
          amount: row.amount,
          unit_price_at_time: row.unitPriceAtTime,
        })) as T[];
    }

    if (query.startsWith('SELECT week_start, job_id, unit_price FROM weekly_prices ORDER BY week_start, job_id')) {
      return [...this.weeklyPrices.values()]
        .sort((a, b) => {
          if (a.weekStart === b.weekStart) {
            return a.jobId.localeCompare(b.jobId);
          }
          return a.weekStart.localeCompare(b.weekStart);
        })
        .map((row) => ({
          week_start: row.weekStart,
          job_id: row.jobId,
          unit_price: row.unitPrice,
        })) as T[];
    }

    throw new Error(`Unsupported all query: ${query}`);
  }
}

describe('d1 repositories', () => {
  it('persists and reads jobs', async () => {
    const db = new FakeD1Database() as unknown as D1Database;
    const repo = createD1JobRepository(db);

    await repo.create({
      id: 'j1',
      name: '包裝',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });

    const jobs = await repo.list();

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ id: 'j1', name: '包裝' });
  });

  it('enforces foreign key for logs', async () => {
    const db = new FakeD1Database() as unknown as D1Database;
    const logRepo = createD1LogRepository(db);

    await expect(
      logRepo.create({
        id: 'l1',
        jobId: 'missing-job',
        date: '2026-04-07',
        amount: 100,
        unitPriceAtTime: 100,
      }),
    ).rejects.toThrow();
  });

  it('upserts and lists weekly prices', async () => {
    const db = new FakeD1Database() as unknown as D1Database;
    const jobRepo = createD1JobRepository(db);
    const weeklyRepo = createD1WeeklyPriceRepository(db);

    await jobRepo.create({
      id: 'j1',
      name: '包裝',
      calcType: 'PIECE',
      unitPrice: 4,
      color: '#22c55e',
    });

    await weeklyRepo.set('2026-04-13', 'j1', 4);
    await weeklyRepo.set('2026-04-13', 'j1', 5);

    await expect(weeklyRepo.listAll()).resolves.toEqual([{ weekStart: '2026-04-13', jobId: 'j1', unitPrice: 5 }]);
  });
});
