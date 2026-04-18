import type { Job } from '../../server/domain/models';
import type { JobRepository } from '../../server/domain/repositories';
import { AppError } from '../../server/http/error';

interface JobRow {
  id: string;
  name: string;
  calc_type: Job['calcType'];
  unit_price: number;
  color: string;
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

export function createD1JobRepository(db: D1Database): JobRepository {
  return {
    async list() {
      const result = (await db.prepare('SELECT id, name, calc_type, unit_price, color FROM jobs ORDER BY id').all<JobRow>()) as D1Results<JobRow>;
      return (result.results ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        calcType: row.calc_type,
        unitPrice: row.unit_price,
        color: row.color,
      }));
    },
    async create(input: Job) {
      try {
        await db.prepare('INSERT INTO jobs (id, name, calc_type, unit_price, color) VALUES (?, ?, ?, ?, ?)').bind(input.id, input.name, input.calcType, input.unitPrice, input.color).run();
      } catch (error) {
        const d1Error = error as { message?: string };
        if (typeof d1Error.message === 'string' && d1Error.message.includes('UNIQUE constraint failed')) {
          throw new AppError('CONFLICT', 409, 'Job id already exists');
        }
        throw error;
      }
      return input;
    },
    async update(id: string, input: Job) {
      const result = (await db
        .prepare('UPDATE jobs SET name = ?, calc_type = ?, unit_price = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(input.name, input.calcType, input.unitPrice, input.color, id)
        .run()) as D1RunResult;
      if ((result.meta?.changes ?? 0) === 0) {
        throw new AppError('NOT_FOUND', 404, 'Job not found');
      }
      return input;
    },
    async remove(id: string) {
      const result = (await db.prepare('DELETE FROM jobs WHERE id = ?').bind(id).run()) as D1RunResult;
      if ((result.meta?.changes ?? 0) === 0) {
        throw new AppError('NOT_FOUND', 404, 'Job not found');
      }
    },
  };
}
