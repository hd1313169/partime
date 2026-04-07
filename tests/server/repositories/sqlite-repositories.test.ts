import { createSqliteDb } from '../../../server/db/sqlite';
import { createSqliteJobRepository } from '../../../server/repositories/sqlite-job-repository';
import { createSqliteLogRepository } from '../../../server/repositories/sqlite-log-repository';

describe('sqlite repositories', () => {
  it('persists and reads jobs', () => {
    const db = createSqliteDb(':memory:');
    const repo = createSqliteJobRepository(db);

    repo.create({
      id: 'j1',
      name: '包裝',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });

    const jobs = repo.list();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toBe('包裝');
  });

  it('enforces foreign key for logs', () => {
    const db = createSqliteDb(':memory:');
    const logRepo = createSqliteLogRepository(db);

    expect(() => {
      logRepo.create({
        id: 'l1',
        jobId: 'missing-job',
        date: '2026-04-07',
        amount: 100,
        unitPriceAtTime: 100,
      });
    }).toThrow();
  });
});
