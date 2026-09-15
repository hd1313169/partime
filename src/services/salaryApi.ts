import { BootstrapData, JobType, WorkLog } from '../types';
import { apiRequest } from './apiClient';
import { salaryApiMock } from './salaryApi.mock';
import { isDemoMode } from './demoMode';

export type { BootstrapData };

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const realSalaryApi = {
  getBootstrap: () => apiRequest<BootstrapData>('/api/bootstrap'),
  createJob: (job: JobType) =>
    apiRequest<JobType>('/api/jobs', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(job),
    }),
  updateJob: (job: JobType) =>
    apiRequest<JobType>(`/api/jobs/${job.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(job),
    }),
  deleteJob: (id: string) =>
    apiRequest<void>(`/api/jobs/${id}`, {
      method: 'DELETE',
    }),
  createLog: (log: WorkLog) =>
    apiRequest<WorkLog>('/api/logs', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(log),
    }),
  updateLog: (log: WorkLog) =>
    apiRequest<WorkLog>(`/api/logs/${log.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(log),
    }),
  deleteLog: (id: string) =>
    apiRequest<void>(`/api/logs/${id}`, {
      method: 'DELETE',
    }),
  setWeeklyPrice: (weekStart: string, jobId: string, unitPrice: number) =>
    apiRequest<void>(`/api/weekly-prices/${weekStart}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ jobId, unitPrice }),
    }),
};

export const salaryApi: typeof realSalaryApi = isDemoMode ? salaryApiMock : realSalaryApi;
