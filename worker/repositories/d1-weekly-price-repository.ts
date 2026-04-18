import type { WeeklyPriceRow } from '../../server/domain/models';
import type { WeeklyPriceRepository } from '../../server/domain/repositories';
import { AppError } from '../../server/http/error';

interface WeeklyPriceRowDb {
  week_start: string;
  job_id: string;
  unit_price: number;
}

interface D1Results<T> {
  results?: T[];
}

export function createD1WeeklyPriceRepository(db: D1Database): WeeklyPriceRepository {
  return {
    set(weekStart: string, jobId: string, unitPrice: number) {
      try {
        db.prepare(
          'INSERT INTO weekly_prices (week_start, job_id, unit_price) VALUES (?, ?, ?) ON CONFLICT(week_start, job_id) DO UPDATE SET unit_price = excluded.unit_price, updated_at = CURRENT_TIMESTAMP',
        )
          .bind(weekStart, jobId, unitPrice)
          .run();
      } catch (error) {
        const d1Error = error as { message?: string };
        if (typeof d1Error.message === 'string' && d1Error.message.includes('constraint failed')) {
          throw new AppError('NOT_FOUND', 404, 'Job not found for weekly price');
        }
        throw error;
      }
    },
    listAll() {
      const result = db.prepare('SELECT week_start, job_id, unit_price FROM weekly_prices ORDER BY week_start, job_id').all<WeeklyPriceRowDb>() as unknown as D1Results<WeeklyPriceRowDb>;
      return (result.results ?? []).map((row): WeeklyPriceRow => ({
        weekStart: row.week_start,
        jobId: row.job_id,
        unitPrice: row.unit_price,
      }));
    },
  };
}
