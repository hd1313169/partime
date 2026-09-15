import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function freshMock() {
  vi.resetModules();
  return import('../../src/services/salaryApi.mock');
}

describe('salaryApi.mock', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds from seedData on first load and persists via storageManager', async () => {
    const { salaryApiMock } = await freshMock();
    const { seedJobs } = await import('../../src/services/seedData');

    const data = await salaryApiMock.getBootstrap();
    expect(data.jobs).toHaveLength(seedJobs.length);
    expect(localStorage.getItem('salary_tracker_jobs')).not.toBeNull();
  });

  it('create/update/delete a job round-trips through the in-memory store and persists', async () => {
    const { salaryApiMock } = await freshMock();

    const newJob = { id: 'test-job-1', name: 'Test Job', calcType: 'FIXED' as const, unitPrice: 100, color: '#000000' };
    await salaryApiMock.createJob(newJob);
    let data = await salaryApiMock.getBootstrap();
    expect(data.jobs.find((j) => j.id === 'test-job-1')).toEqual(newJob);
    expect(JSON.parse(localStorage.getItem('salary_tracker_jobs')!)).toContainEqual(newJob);

    const updatedJob = { ...newJob, name: 'Updated Job' };
    await salaryApiMock.updateJob(updatedJob);
    data = await salaryApiMock.getBootstrap();
    expect(data.jobs.find((j) => j.id === 'test-job-1')).toEqual(updatedJob);

    await salaryApiMock.deleteJob('test-job-1');
    data = await salaryApiMock.getBootstrap();
    expect(data.jobs.find((j) => j.id === 'test-job-1')).toBeUndefined();
  });

  it('create/update/delete a log round-trips through the in-memory store and persists', async () => {
    const { salaryApiMock } = await freshMock();

    const newLog = { id: 'test-log-1', jobId: 'seed-job-hourly', date: '2026-01-01', amount: 100, unitPriceAtTime: 100 };
    await salaryApiMock.createLog(newLog);
    let data = await salaryApiMock.getBootstrap();
    expect(data.logs.find((l) => l.id === 'test-log-1')).toEqual(newLog);

    const updatedLog = { ...newLog, amount: 200 };
    await salaryApiMock.updateLog(updatedLog);
    data = await salaryApiMock.getBootstrap();
    expect(data.logs.find((l) => l.id === 'test-log-1')).toEqual(updatedLog);

    await salaryApiMock.deleteLog('test-log-1');
    data = await salaryApiMock.getBootstrap();
    expect(data.logs.find((l) => l.id === 'test-log-1')).toBeUndefined();
  });

  it('setWeeklyPrice persists into weeklyPrices', async () => {
    const { salaryApiMock } = await freshMock();

    await salaryApiMock.setWeeklyPrice('2026-01-05', 'seed-job-hourly', 999);
    const data = await salaryApiMock.getBootstrap();
    expect(data.weeklyPrices['2026-01-05']['seed-job-hourly']).toBe(999);
  });

  it('resetToSeed clears local changes and restores the original seed data', async () => {
    const { salaryApiMock, resetToSeed } = await freshMock();
    const { seedJobs } = await import('../../src/services/seedData');

    await salaryApiMock.deleteJob(seedJobs[0].id);
    let data = await salaryApiMock.getBootstrap();
    expect(data.jobs).toHaveLength(seedJobs.length - 1);

    resetToSeed();
    data = await salaryApiMock.getBootstrap();
    expect(data.jobs).toHaveLength(seedJobs.length);
  });

  it('has no import of apiClient and makes no network call', () => {
    const source = readFileSync(resolve(__dirname, '../../src/services/salaryApi.mock.ts'), 'utf-8');
    expect(source).not.toMatch(/apiClient/);
    expect(source).not.toMatch(/\bfetch\(/);
  });
});
