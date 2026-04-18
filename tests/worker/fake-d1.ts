import type { Job, WorkLog } from '../../server/domain/models';

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

/**
 * In-memory D1Database stub for worker tests.
 * Implements only the SQL patterns exercised by the D1 repository adapters.
 */
export class FakeD1Database {
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
    // ── Jobs ─────────────────────────────────────────────────────────────
    if (query.startsWith('INSERT INTO jobs')) {
      const [id, name, calcType, unitPrice, color] = args as [string, string, Job['calcType'], number, string];
      if (this.jobs.has(id)) {
        throw new Error('UNIQUE constraint failed: jobs.id');
      }
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

    // ── Logs ─────────────────────────────────────────────────────────────
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
      if (this.logs.has(id)) {
        throw new Error('UNIQUE constraint failed: logs.id');
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

    // ── Weekly prices ─────────────────────────────────────────────────────
    if (query.startsWith('INSERT INTO weekly_prices')) {
      const [weekStart, jobId, unitPrice] = args as [string, string, number];
      if (!this.jobs.has(jobId)) {
        throw new Error('D1_ERROR: FOREIGN KEY constraint failed');
      }
      this.weeklyPrices.set(`${weekStart}:${jobId}`, { weekStart, jobId, unitPrice });
      return { success: true };
    }

    throw new Error(`FakeD1Database: unsupported run query: ${query}`);
  }

  private executeFirst<T>(_query: string, _args: unknown[]): T | null {
    return null;
  }

  private executeAll<T>(query: string, args: unknown[]): T[] {
    // ── Jobs ─────────────────────────────────────────────────────────────
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

    // ── Logs (listAll) ────────────────────────────────────────────────────
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

    // ── Logs (listByWeekStart) ────────────────────────────────────────────
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
          const v = new Date(`${row.date}T00:00:00.000Z`).getTime();
          return v >= start && v <= end;
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

    // ── Weekly prices ─────────────────────────────────────────────────────
    if (query.startsWith('SELECT week_start, job_id, unit_price FROM weekly_prices ORDER BY week_start, job_id')) {
      return [...this.weeklyPrices.values()]
        .sort((a, b) => (a.weekStart === b.weekStart ? a.jobId.localeCompare(b.jobId) : a.weekStart.localeCompare(b.weekStart)))
        .map((row) => ({
          week_start: row.weekStart,
          job_id: row.jobId,
          unit_price: row.unitPrice,
        })) as T[];
    }

    throw new Error(`FakeD1Database: unsupported all query: ${query}`);
  }
}
