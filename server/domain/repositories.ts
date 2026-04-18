import { Job, WorkLog, WeeklyPriceRow } from './models';

export type Awaitable<T> = T | Promise<T>;

export interface JobRepository {
  list(): Awaitable<Job[]>;
  create(input: Job): Awaitable<Job>;
  update(id: string, input: Job): Awaitable<Job>;
  remove(id: string): Awaitable<void>;
}

export interface LogRepository {
  listByWeekStart(weekStart: string): Awaitable<WorkLog[]>;
  listAll(): Awaitable<WorkLog[]>;
  create(input: WorkLog): Awaitable<WorkLog>;
  update(id: string, input: WorkLog): Awaitable<WorkLog>;
  remove(id: string): Awaitable<void>;
}

export interface WeeklyPriceRepository {
  set(weekStart: string, jobId: string, unitPrice: number): Awaitable<void>;
  listAll(): Awaitable<WeeklyPriceRow[]>;
}
