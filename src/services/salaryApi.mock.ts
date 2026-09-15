import { BootstrapData, JobType, WeeklyPriceConfig, WorkLog } from '../types';
import { seedJobs, seedLogs, seedWeeklyPrices } from './seedData';
import { storageManager } from './storageManager';

function loadInitialState(): { jobs: JobType[]; logs: WorkLog[]; weeklyPrices: WeeklyPriceConfig } {
  const storedJobs = storageManager.getJobs();
  const storedLogs = storageManager.getLogs();
  const storedWeeklyPrices = storageManager.getWeeklyPrices();

  if (storedJobs === null && storedLogs === null && storedWeeklyPrices === null) {
    const jobs = seedJobs.map((job) => ({ ...job }));
    const logs = seedLogs.map((log) => ({ ...log }));
    const weeklyPrices = JSON.parse(JSON.stringify(seedWeeklyPrices)) as WeeklyPriceConfig;
    storageManager.saveJobs(jobs);
    storageManager.saveLogs(logs);
    storageManager.saveWeeklyPrices(weeklyPrices);
    return { jobs, logs, weeklyPrices };
  }

  return {
    jobs: storedJobs ?? [],
    logs: storedLogs ?? [],
    weeklyPrices: storedWeeklyPrices ?? {},
  };
}

let state = loadInitialState();

export const salaryApiMock = {
  getBootstrap: async (): Promise<BootstrapData> => ({
    jobs: state.jobs,
    logs: state.logs,
    weeklyPrices: state.weeklyPrices,
  }),

  createJob: async (job: JobType): Promise<JobType> => {
    state.jobs = [...state.jobs, job];
    storageManager.saveJobs(state.jobs);
    return job;
  },

  updateJob: async (job: JobType): Promise<JobType> => {
    state.jobs = state.jobs.map((existing) => (existing.id === job.id ? job : existing));
    storageManager.saveJobs(state.jobs);
    return job;
  },

  deleteJob: async (id: string): Promise<void> => {
    state.jobs = state.jobs.filter((job) => job.id !== id);
    storageManager.saveJobs(state.jobs);
  },

  createLog: async (log: WorkLog): Promise<WorkLog> => {
    state.logs = [...state.logs, log];
    storageManager.saveLogs(state.logs);
    return log;
  },

  updateLog: async (log: WorkLog): Promise<WorkLog> => {
    state.logs = state.logs.map((existing) => (existing.id === log.id ? log : existing));
    storageManager.saveLogs(state.logs);
    return log;
  },

  deleteLog: async (id: string): Promise<void> => {
    state.logs = state.logs.filter((log) => log.id !== id);
    storageManager.saveLogs(state.logs);
  },

  setWeeklyPrice: async (weekStart: string, jobId: string, unitPrice: number): Promise<void> => {
    state.weeklyPrices = {
      ...state.weeklyPrices,
      [weekStart]: {
        ...(state.weeklyPrices[weekStart] || {}),
        [jobId]: unitPrice,
      },
    };
    storageManager.saveWeeklyPrices(state.weeklyPrices);
  },
};

export function resetToSeed(): void {
  storageManager.clearAll();
  state = loadInitialState();
}
