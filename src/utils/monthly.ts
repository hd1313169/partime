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
