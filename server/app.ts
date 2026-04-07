import express from 'express';
import { createSqliteDb } from './db/sqlite';
import { errorMiddleware } from './http/error-middleware';
import { createBootstrapRouter } from './routes/bootstrap';
import { healthRouter } from './routes/health';
import { createJobsRouter } from './routes/jobs';
import { createLogsRouter } from './routes/logs';
import { createWeeklyPricesRouter } from './routes/weekly-prices';
import { createSqliteJobRepository } from './repositories/sqlite-job-repository';
import { createSqliteLogRepository } from './repositories/sqlite-log-repository';
import { createSqliteWeeklyPriceRepository } from './repositories/sqlite-weekly-price-repository';
import { createSalaryService } from './services/salary-service';

interface CreateAppOptions {
  dbPath?: string;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const db = createSqliteDb(options.dbPath ?? ':memory:');

  const service = createSalaryService({
    jobRepo: createSqliteJobRepository(db),
    logRepo: createSqliteLogRepository(db),
    weeklyPriceRepo: createSqliteWeeklyPriceRepository(db),
  });

  app.use(express.json());
  app.use('/api', healthRouter);
  app.use('/api', createBootstrapRouter(service));
  app.use('/api', createJobsRouter(service));
  app.use('/api', createLogsRouter(service));
  app.use('/api', createWeeklyPricesRouter(service));
  app.use(errorMiddleware);

  return app;
}
