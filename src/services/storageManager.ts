
import { JobType, WorkLog, WeeklyPriceConfig } from '../types';

const STORAGE_KEYS = {
  JOBS: 'salary_tracker_jobs',
  LOGS: 'salary_tracker_logs',
  WEEKLY_PRICES: 'salary_tracker_weekly_prices',
};

export const storageManager = {
  saveJobs: (jobs: JobType[]) => {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  },
  getJobs: (): JobType[] | null => {
    const data = localStorage.getItem(STORAGE_KEYS.JOBS);
    return data ? JSON.parse(data) : null;
  },

  saveLogs: (logs: WorkLog[]) => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },
  getLogs: (): WorkLog[] | null => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : null;
  },

  saveWeeklyPrices: (prices: WeeklyPriceConfig) => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_PRICES, JSON.stringify(prices));
  },
  getWeeklyPrices: (): WeeklyPriceConfig | null => {
    const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_PRICES);
    return data ? JSON.parse(data) : null;
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};
