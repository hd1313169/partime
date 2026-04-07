import { SqliteDb } from '../db/sqlite';
import { WeeklyPriceRepository } from '../domain/repositories';
import { WeeklyPriceRow } from '../domain/models';
import { AppError } from '../http/error';

interface WeeklyRow {
  week_start: string;
  job_id: string;
  unit_price: number;
}

export function createSqliteWeeklyPriceRepository(db: SqliteDb): WeeklyPriceRepository {
  return {
    set(weekStart: string, jobId: string, unitPrice: number) {
      try {
        db.prepare(
          'INSERT INTO weekly_prices (week_start, job_id, unit_price) VALUES (?, ?, ?) ON CONFLICT(week_start, job_id) DO UPDATE SET unit_price = excluded.unit_price, updated_at = CURRENT_TIMESTAMP',
        ).run(weekStart, jobId, unitPrice);
      } catch (error) {
        if (error instanceof Error && error.message.includes('SQLITE_CONSTRAINT')) {
          throw new AppError('NOT_FOUND', 404, 'Job not found for weekly price');
        }
        throw error;
      }
    },
    listAll() {
      const rows = db.prepare('SELECT week_start, job_id, unit_price FROM weekly_prices ORDER BY week_start, job_id').all() as WeeklyRow[];
      return rows.map((row): WeeklyPriceRow => ({
        weekStart: row.week_start,
        jobId: row.job_id,
        unitPrice: row.unit_price,
      }));
    },
  };
}
