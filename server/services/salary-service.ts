import { Job, WorkLog } from '../domain/models';
import { JobRepository, LogRepository, WeeklyPriceRepository } from '../domain/repositories';

interface SalaryServiceDeps {
  jobRepo: JobRepository;
  logRepo: LogRepository;
  weeklyPriceRepo: WeeklyPriceRepository;
}

export function createSalaryService({ jobRepo, logRepo, weeklyPriceRepo }: SalaryServiceDeps) {
  return {
    listJobs() {
      return jobRepo.list();
    },
    createJob(input: Job) {
      return jobRepo.create(input);
    },
    updateJob(id: string, input: Job) {
      return jobRepo.update(id, input);
    },
    deleteJob(id: string) {
      return jobRepo.remove(id);
    },
    listLogs() {
      return logRepo.listAll();
    },
    createLog(input: WorkLog) {
      return logRepo.create(input);
    },
    updateLog(id: string, input: WorkLog) {
      return logRepo.update(id, input);
    },
    deleteLog(id: string) {
      return logRepo.remove(id);
    },
    setWeeklyPrice(weekStart: string, jobId: string, unitPrice: number) {
      return weeklyPriceRepo.set(weekStart, jobId, unitPrice);
    },
    getBootstrapData() {
      const weeklyRows = weeklyPriceRepo.listAll();
      const weeklyPrices = weeklyRows.reduce<Record<string, Record<string, number>>>((acc, row) => {
        if (!acc[row.weekStart]) {
          acc[row.weekStart] = {};
        }
        acc[row.weekStart][row.jobId] = row.unitPrice;
        return acc;
      }, {});

      return {
        jobs: jobRepo.list(),
        logs: logRepo.listAll(),
        weeklyPrices,
      };
    },
  };
}
