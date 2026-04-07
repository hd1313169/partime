import { AppError } from './error';
import { Job, WorkLog } from '../domain/models';

const calcTypes = new Set<Job['calcType']>(['HOURLY', 'PIECE', 'FIXED']);

export function assertValidJobPayload(payload: unknown): asserts payload is Job {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid job payload');
  }

  const data = payload as Partial<Job>;

  if (!data.id || typeof data.id !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid job id', { field: 'id' });
  }
  if (!data.name || typeof data.name !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid job name', { field: 'name' });
  }
  if (!data.calcType || !calcTypes.has(data.calcType)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid calc type', { field: 'calcType' });
  }
  if (typeof data.unitPrice !== 'number' || Number.isNaN(data.unitPrice)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid unit price', { field: 'unitPrice' });
  }
  if (!data.color || typeof data.color !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid color', { field: 'color' });
  }
}

export function assertValidLogPayload(payload: unknown): asserts payload is WorkLog {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid log payload');
  }

  const data = payload as Partial<WorkLog>;

  if (!data.id || typeof data.id !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid log id', { field: 'id' });
  }
  if (!data.jobId || typeof data.jobId !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid job id', { field: 'jobId' });
  }
  if (!data.date || typeof data.date !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid date', { field: 'date' });
  }
  if (typeof data.amount !== 'number' || Number.isNaN(data.amount)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid amount', { field: 'amount' });
  }
  if (typeof data.unitPriceAtTime !== 'number' || Number.isNaN(data.unitPriceAtTime)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid unitPriceAtTime', { field: 'unitPriceAtTime' });
  }
}

export function assertValidWeeklyPricePayload(payload: unknown): asserts payload is { jobId: string; unitPrice: number } {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid weekly price payload');
  }

  const data = payload as { jobId?: unknown; unitPrice?: unknown };

  if (!data.jobId || typeof data.jobId !== 'string') {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid jobId', { field: 'jobId' });
  }

  if (typeof data.unitPrice !== 'number' || Number.isNaN(data.unitPrice)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid unitPrice', { field: 'unitPrice' });
  }
}
