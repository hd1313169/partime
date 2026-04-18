import type { WorkLog } from '../../server/domain/models';
import type { LogRepository } from '../../server/domain/repositories';
import { AppError } from '../../server/http/error';

interface LogRow {
  id: string;
  job_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  quantity: number | null;
  amount: number;
  unit_price_at_time: number;
}

interface D1Results<T> {
  results?: T[];
}

interface D1RunMeta {
  changes?: number;
}

interface D1RunResult {
  meta?: D1RunMeta;
}

function mapLogRow(row: LogRow): WorkLog {
  return {
    id: row.id,
    jobId: row.job_id,
    date: row.date,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    quantity: row.quantity ?? undefined,
    amount: row.amount,
    unitPriceAtTime: row.unit_price_at_time,
  };
}

export function createD1LogRepository(db: D1Database): LogRepository {
  return {
    listByWeekStart(weekStart: string) {
      const result = db
        .prepare(
          "SELECT id, job_id, date, start_time, end_time, quantity, amount, unit_price_at_time FROM logs WHERE date >= date(?) AND date <= date(?, '+6 day') ORDER BY date, id",
        )
        .bind(weekStart, weekStart)
        .all<LogRow>() as unknown as D1Results<LogRow>;

      return (result.results ?? []).map(mapLogRow);
    },
    listAll() {
      const result = db
        .prepare('SELECT id, job_id, date, start_time, end_time, quantity, amount, unit_price_at_time FROM logs ORDER BY date, id')
        .all<LogRow>() as unknown as D1Results<LogRow>;

      return (result.results ?? []).map(mapLogRow);
    },
    create(input: WorkLog) {
      try {
        db.prepare('INSERT INTO logs (id, job_id, date, start_time, end_time, quantity, amount, unit_price_at_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(
            input.id,
            input.jobId,
            input.date,
            input.startTime ?? null,
            input.endTime ?? null,
            input.quantity ?? null,
            input.amount,
            input.unitPriceAtTime,
          )
          .run();
      } catch (error) {
        const d1Error = error as { message?: string };
        if (typeof d1Error.message === 'string' && d1Error.message.includes('constraint failed')) {
          throw new AppError('CONFLICT', 409, 'Log create conflict');
        }
        throw error;
      }
      return input;
    },
    update(id: string, input: WorkLog) {
      const result = db
        .prepare('UPDATE logs SET job_id=?, date=?, start_time=?, end_time=?, quantity=?, amount=?, unit_price_at_time=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .bind(
          input.jobId,
          input.date,
          input.startTime ?? null,
          input.endTime ?? null,
          input.quantity ?? null,
          input.amount,
          input.unitPriceAtTime,
          id,
        )
        .run() as unknown as D1RunResult;

      if ((result.meta?.changes ?? 0) === 0) {
        throw new AppError('NOT_FOUND', 404, 'Log not found');
      }
      return input;
    },
    remove(id: string) {
      const result = db.prepare('DELETE FROM logs WHERE id = ?').bind(id).run() as unknown as D1RunResult;
      if ((result.meta?.changes ?? 0) === 0) {
        throw new AppError('NOT_FOUND', 404, 'Log not found');
      }
    },
  };
}
