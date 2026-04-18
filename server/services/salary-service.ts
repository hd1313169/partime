import { Job, WorkLog } from '../domain/models';
import { JobRepository, LogRepository, WeeklyPriceRepository } from '../domain/repositories';

interface SalaryServiceDeps {
  jobRepo: JobRepository;
  logRepo: LogRepository;
  weeklyPriceRepo: WeeklyPriceRepository;
}

export function createSalaryService({ jobRepo, logRepo, weeklyPriceRepo }: SalaryServiceDeps) {
  return {
    async listJobs() {
      return await jobRepo.list();
    },
    async createJob(input: Job) {
      return await jobRepo.create(input);
    },
    async updateJob(id: string, input: Job) {
      return await jobRepo.update(id, input);
    },
    async deleteJob(id: string) {
      await jobRepo.remove(id);
    },
    async listLogs() {
      return await logRepo.listAll();
    },
    async createLog(input: WorkLog) {
      return await logRepo.create(input);
    },
    async updateLog(id: string, input: WorkLog) {
      return await logRepo.update(id, input);
    },
    async deleteLog(id: string) {
      await logRepo.remove(id);
    },
    async setWeeklyPrice(weekStart: string, jobId: string, unitPrice: number) {
      await weeklyPriceRepo.set(weekStart, jobId, unitPrice);
    },
    async getBootstrapData() {
      const [weeklyRows, jobs, logs] = await Promise.all([weeklyPriceRepo.listAll(), jobRepo.list(), logRepo.listAll()]);
      const weeklyPrices = weeklyRows.reduce<Record<string, Record<string, number>>>((acc, row) => {
        if (!acc[row.weekStart]) {
          acc[row.weekStart] = {};
        }
        acc[row.weekStart][row.jobId] = row.unitPrice;
        return acc;
      }, {});

      return {
        jobs,
        logs,
        weeklyPrices,
      };
    },
  };
}
