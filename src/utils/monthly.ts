// src/utils/monthly.ts
import { differenceInMinutes, parse } from 'date-fns';
import { JobType, WorkLog } from '../types';

export interface MonthlyJobStat {
  job: JobType;
  totalMinutes?: number;    // 計時型：分鐘加總（顯示時再 Math.ceil 為小時）
  totalQuantity?: number;   // 計件/固定型：件數加總
  totalAmount: number;
}

export interface MonthlyReportData {
  stats: MonthlyJobStat[];
  grandTotal: number;
}

export function computeMonthlyReport(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number // 1-based (1=January)
): MonthlyReportData {
  const jobMap = new Map(jobs.map(j => [j.id, j]));
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const monthLogs = logs.filter(l => l.date.startsWith(prefix));

  const statMap = new Map<string, MonthlyJobStat>();

  for (const log of monthLogs) {
    const job = jobMap.get(log.jobId);
    if (!job) continue; // 已刪除的工作項目略過

    if (!statMap.has(job.id)) {
      statMap.set(job.id, {
        job,
        totalMinutes: job.calcType === 'HOURLY' ? 0 : undefined,
        totalQuantity: job.calcType !== 'HOURLY' ? 0 : undefined,
        totalAmount: 0,
      });
    }

    const stat = statMap.get(job.id)!;
    stat.totalAmount += log.amount;

    if (job.calcType === 'HOURLY') {
      if (log.startTime && log.endTime) {
        const start = parse(log.startTime, 'HH:mm', new Date(0));
        const end = parse(log.endTime, 'HH:mm', new Date(0));
        stat.totalMinutes = (stat.totalMinutes ?? 0) + differenceInMinutes(end, start);
      }
    } else {
      stat.totalQuantity = (stat.totalQuantity ?? 0) + (log.quantity ?? 0);
    }
  }

  const stats = Array.from(statMap.values());
  const grandTotal = stats.reduce((sum, s) => sum + s.totalAmount, 0);

  return { stats, grandTotal };
}

export interface DailyIncome {
  day: number;                      // 1-based day of month
  total: number;
  byJob: Record<string, number>;    // jobId -> amount
}

const monthPrefix = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;

/** 當月每日收入，補齊 1 日至月底；已刪除的工作項目略過（與 computeMonthlyReport 一致）。 */
export function computeDailyBreakdown(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number // 1-based
): DailyIncome[] {
  const jobIds = new Set(jobs.map(j => j.id));
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: DailyIncome[] = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: 0, byJob: {} }));
  const prefix = monthPrefix(year, month);

  for (const log of logs) {
    if (!log.date.startsWith(prefix) || !jobIds.has(log.jobId)) continue;
    const d = days[Number(log.date.slice(8, 10)) - 1];
    if (!d) continue;
    d.total += log.amount;
    d.byJob[log.jobId] = (d.byJob[log.jobId] ?? 0) + log.amount;
  }
  return days;
}

export interface MonthTotal {
  year: number;
  month: number; // 1-based
  total: number;
}

/** 以 (year, month) 為終點、往回連續 span 個月的月總工資，舊到新排序。 */
export function computeMonthlyTrend(
  logs: WorkLog[],
  jobs: JobType[],
  year: number,
  month: number, // 1-based
  span = 6
): MonthTotal[] {
  const jobIds = new Set(jobs.map(j => j.id));
  const result: MonthTotal[] = [];
  const index = new Map<string, MonthTotal>();
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const entry = { year: d.getFullYear(), month: d.getMonth() + 1, total: 0 };
    result.push(entry);
    index.set(monthPrefix(entry.year, entry.month), entry);
  }
  for (const log of logs) {
    if (!jobIds.has(log.jobId)) continue;
    const entry = index.get(log.date.slice(0, 7));
    if (entry) entry.total += log.amount;
  }
  return result;
}
