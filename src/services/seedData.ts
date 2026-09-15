import { addDays, format, startOfWeek, subWeeks } from 'date-fns';
import { JobType, WeeklyPriceConfig, WorkLog } from '../types';

export const seedJobs: JobType[] = [
  { id: 'seed-job-hourly', name: '倉庫理貨', calcType: 'HOURLY', unitPrice: 180, color: '#10b981' },
  { id: 'seed-job-piece', name: '手工包裝', calcType: 'PIECE', unitPrice: 15, color: '#f59e0b' },
  { id: 'seed-job-fixed', name: '假日代班', calcType: 'FIXED', unitPrice: 800, color: '#6366f1' },
];

function iso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function buildSeedLogs(): WorkLog[] {
  const today = new Date();
  const logs: WorkLog[] = [];
  let counter = 0;

  for (let weekOffset = 2; weekOffset >= 0; weekOffset--) {
    const weekStart = startOfWeek(subWeeks(today, weekOffset), { weekStartsOn: 1 });

    counter++;
    logs.push({
      id: `seed-log-${counter}`,
      jobId: 'seed-job-hourly',
      date: iso(addDays(weekStart, 0)),
      startTime: '09:00',
      endTime: '13:00',
      amount: 180 * 4,
      unitPriceAtTime: 180,
    });

    counter++;
    logs.push({
      id: `seed-log-${counter}`,
      jobId: 'seed-job-hourly',
      date: iso(addDays(weekStart, 3)),
      startTime: '13:00',
      endTime: '18:00',
      amount: 180 * 5,
      unitPriceAtTime: 180,
    });

    counter++;
    logs.push({
      id: `seed-log-${counter}`,
      jobId: 'seed-job-piece',
      date: iso(addDays(weekStart, 2)),
      quantity: 40,
      amount: 15 * 40,
      unitPriceAtTime: 15,
    });

    if (weekOffset < 2) {
      counter++;
      logs.push({
        id: `seed-log-${counter}`,
        jobId: 'seed-job-fixed',
        date: iso(addDays(weekStart, 5)),
        quantity: 1,
        amount: 800,
        unitPriceAtTime: 800,
      });
    }
  }

  return logs;
}

function buildSeedWeeklyPrices(): WeeklyPriceConfig {
  const today = new Date();
  const earliestWeekStart = iso(startOfWeek(subWeeks(today, 2), { weekStartsOn: 1 }));

  return {
    [earliestWeekStart]: { 'seed-job-hourly': 175 },
  };
}

export const seedLogs = buildSeedLogs();
export const seedWeeklyPrices = buildSeedWeeklyPrices();
