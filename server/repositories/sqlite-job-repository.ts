import { SqliteDb } from '../db/sqlite';
import { Job } from '../domain/models';
import { JobRepository } from '../domain/repositories';
import { AppError } from '../http/error';

interface JobRow {
  id: string;
  name: string;
  calc_type: Job['calcType'];
  unit_price: number;
  color: string;
}

export function createSqliteJobRepository(db: SqliteDb): JobRepository {
  return {
    list() {
      const rows = db.prepare('SELECT id, name, calc_type, unit_price, color FROM jobs ORDER BY id').all() as JobRow[];
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        calcType: row.calc_type,
        unitPrice: row.unit_price,
        color: row.color,
      }));
    },
    create(input: Job) {
      try {
        db.prepare('INSERT INTO jobs (id, name, calc_type, unit_price, color) VALUES (?, ?, ?, ?, ?)').run(
          input.id,
          input.name,
          input.calcType,
          input.unitPrice,
          input.color,
        );
      } catch (error) {
        const sqliteError = error as { code?: string; message?: string };
        const isConstraint =
          (typeof sqliteError.code === 'string' && sqliteError.code.startsWith('SQLITE_CONSTRAINT')) ||
          (typeof sqliteError.message === 'string' && sqliteError.message.includes('UNIQUE constraint failed'));

        if (isConstraint) {
          throw new AppError('CONFLICT', 409, 'Job id already exists');
        }
        throw error;
      }
      return input;
    },
    update(id: string, input: Job) {
      const result = db.prepare('UPDATE jobs SET name = ?, calc_type = ?, unit_price = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        input.name,
        input.calcType,
        input.unitPrice,
        input.color,
        id,
      );
      if (result.changes === 0) {
        throw new AppError('NOT_FOUND', 404, 'Job not found');
      }
      return input;
    },
    remove(id: string) {
      const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
      if (result.changes === 0) {
        throw new AppError('NOT_FOUND', 404, 'Job not found');
      }
    },
  };
}
