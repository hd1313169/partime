import { addDays, eachWeekOfInterval, format, isWithinInterval, startOfWeek } from 'date-fns';
import { JobType, WeeklyPriceConfig, WorkLog } from '../types';

export const seedJobs: JobType[] = [
  { id: 'seed-job-hourly', name: '倉庫理貨', calcType: 'HOURLY', unitPrice: 180, color: '#10b981' },
  { id: 'seed-job-piece', name: '手工包裝', calcType: 'PIECE', unitPrice: 15, color: '#f59e0b' },
  { id: 'seed-job-fixed', name: '假日代班', calcType: 'FIXED', unitPrice: 800, color: '#6366f1' },
];

// Fixed to 2026-08 / 2026-09 so the demo shows a full, richly-populated two-month history
// regardless of when it is visited (the alternative - generating logs relative to "today" -
// left most of the month sparse or empty when today falls mid-month).
const RANGE_START = new Date(2026, 7, 1); // 2026-08-01
const RANGE_END = new Date(2026, 8, 30); // 2026-09-30

function iso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function inRange(date: Date): boolean {
  return isWithinInterval(date, { start: RANGE_START, end: RANGE_END });
}

function buildSeedLogs(): WorkLog[] {
  const logs: WorkLog[] = [];
  let counter = 0;

  const push = (log: Omit<WorkLog, 'id'>) => {
    counter++;
    logs.push({ id: `seed-log-${counter}`, ...log });
  };

  const weekStarts = eachWeekOfInterval({ start: RANGE_START, end: RANGE_END }, { weekStartsOn: 1 });

  weekStarts.forEach((weekStart, weekIndex) => {
    const monday = addDays(weekStart, 0);
    const tuesday = addDays(weekStart, 1);
    const wednesday = addDays(weekStart, 2);
    const thursday = addDays(weekStart, 3);
    const friday = addDays(weekStart, 4);
    const saturday = addDays(weekStart, 5);

    if (inRange(monday)) {
      push({
        jobId: 'seed-job-hourly',
        date: iso(monday),
        startTime: '09:00',
        endTime: '13:00',
        amount: 180 * 4,
        unitPriceAtTime: 180,
      });
    }

    if (inRange(wednesday)) {
      push({
        jobId: 'seed-job-hourly',
        date: iso(wednesday),
        startTime: '13:00',
        endTime: '18:00',
        amount: 180 * 5,
        unitPriceAtTime: 180,
      });
    }

    if (inRange(friday)) {
      push({
        jobId: 'seed-job-hourly',
        date: iso(friday),
        startTime: '09:00',
        endTime: '12:00',
        amount: 180 * 3,
        unitPriceAtTime: 180,
      });
    }

    if (inRange(tuesday)) {
      push({
        jobId: 'seed-job-piece',
        date: iso(tuesday),
        quantity: 40,
        amount: 15 * 40,
        unitPriceAtTime: 15,
      });
    }

    if (inRange(thursday)) {
      push({
        jobId: 'seed-job-piece',
        date: iso(thursday),
        quantity: 55,
        amount: 15 * 55,
        unitPriceAtTime: 15,
      });
    }

    if (weekIndex % 2 === 0 && inRange(saturday)) {
      push({
        jobId: 'seed-job-fixed',
        date: iso(saturday),
        quantity: 1,
        amount: 800,
        unitPriceAtTime: 800,
      });
    }
  });

  return logs;
}

function buildSeedWeeklyPrices(): WeeklyPriceConfig {
  const augustWeekStart = iso(startOfWeek(RANGE_START, { weekStartsOn: 1 }));
  const septemberWeekStart = iso(startOfWeek(new Date(2026, 8, 1), { weekStartsOn: 1 }));

  return {
    [augustWeekStart]: { 'seed-job-hourly': 170, 'seed-job-piece': 14 },
    [septemberWeekStart]: { 'seed-job-hourly': 180, 'seed-job-piece': 15 },
  };
}

export const seedLogs = buildSeedLogs();
export const seedWeeklyPrices = buildSeedWeeklyPrices();
