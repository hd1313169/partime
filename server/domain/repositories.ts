import { Job, WorkLog, WeeklyPriceRow } from './models';

export interface JobRepository {
  list(): Job[];
  create(input: Job): Job;
  update(id: string, input: Job): Job;
  remove(id: string): void;
}

export interface LogRepository {
  listByWeekStart(weekStart: string): WorkLog[];
  listAll(): WorkLog[];
  create(input: WorkLog): WorkLog;
  update(id: string, input: WorkLog): WorkLog;
  remove(id: string): void;
}

export interface WeeklyPriceRepository {
  set(weekStart: string, jobId: string, unitPrice: number): void;
  listAll(): WeeklyPriceRow[];
}
