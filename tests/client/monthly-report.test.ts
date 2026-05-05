// tests/client/monthly-report.test.ts
import { describe, it, expect } from 'vitest';
import { computeMonthlyReport } from '../../src/utils/monthly';
import { JobType, WorkLog } from '../../src/types';

const hourlyJob: JobType = { id: 'j1', name: '早班', calcType: 'HOURLY', unitPrice: 120, color: '#ff0000' };
const pieceJob: JobType  = { id: 'j2', name: '計件', calcType: 'PIECE',  unitPrice: 10,  color: '#00ff00' };
const fixedJob: JobType  = { id: 'j3', name: '固定', calcType: 'FIXED',  unitPrice: 500, color: '#0000ff' };

const makeLog = (overrides: Partial<WorkLog> & Pick<WorkLog, 'id' | 'jobId' | 'date' | 'amount'>): WorkLog => ({
  unitPriceAtTime: 120,
  ...overrides,
});

describe('computeMonthlyReport', () => {
  it('空月份回傳空 stats 與 grandTotal 0', () => {
    const result = computeMonthlyReport([], [hourlyJob], 2026, 5);
    expect(result).toEqual({ stats: [], grandTotal: 0 });
  });

  it('計時型：多筆 log 加總分鐘，工資加總', () => {
    const logs = [
      makeLog({ id: 'l1', jobId: 'j1', date: '2026-05-01', startTime: '09:00', endTime: '11:00', amount: 240 }),
      makeLog({ id: 'l2', jobId: 'j1', date: '2026-05-03', startTime: '09:00', endTime: '10:30', amount: 180 }),
    ];
    const result = computeMonthlyReport(logs, [hourlyJob], 2026, 5);
    expect(result.stats).toHaveLength(1);
    expect(result.stats[0].totalMinutes).toBe(210); // 120 + 90
    expect(result.stats[0].totalAmount).toBe(420);
    expect(result.grandTotal).toBe(420);
  });

  it('計件型：多筆 log 加總件數與工資', () => {
    const logs = [
      makeLog({ id: 'l3', jobId: 'j2', date: '2026-05-01', quantity: 50, amount: 500 }),
      makeLog({ id: 'l4', jobId: 'j2', date: '2026-05-02', quantity: 30, amount: 300 }),
    ];
    const result = computeMonthlyReport(logs, [pieceJob], 2026, 5);
    expect(result.stats[0].totalQuantity).toBe(80);
    expect(result.stats[0].totalAmount).toBe(800);
  });

  it('跨月 log 只計入正確月份', () => {
    const logs = [
      makeLog({ id: 'l5', jobId: 'j1', date: '2026-04-30', startTime: '09:00', endTime: '10:00', amount: 120 }),
      makeLog({ id: 'l6', jobId: 'j1', date: '2026-05-01', startTime: '09:00', endTime: '10:00', amount: 120 }),
    ];
    const mayResult = computeMonthlyReport(logs, [hourlyJob], 2026, 5);
    expect(mayResult.stats[0].totalMinutes).toBe(60);
    expect(mayResult.grandTotal).toBe(120);

    const aprResult = computeMonthlyReport(logs, [hourlyJob], 2026, 4);
    expect(aprResult.stats[0].totalMinutes).toBe(60);
  });

  it('已刪除工作項目（jobId 不存在）被略過', () => {
    const logs = [
      makeLog({ id: 'l7', jobId: 'deleted', date: '2026-05-01', amount: 999 }),
      makeLog({ id: 'l8', jobId: 'j2', date: '2026-05-01', quantity: 10, amount: 100 }),
    ];
    const result = computeMonthlyReport(logs, [pieceJob], 2026, 5);
    expect(result.stats).toHaveLength(1);
    expect(result.grandTotal).toBe(100);
  });

  it('多工作項目各自加總，grandTotal 為全部工資總和', () => {
    const logs = [
      makeLog({ id: 'l9',  jobId: 'j1', date: '2026-05-01', startTime: '09:00', endTime: '10:00', amount: 120 }),
      makeLog({ id: 'l10', jobId: 'j2', date: '2026-05-01', quantity: 10, amount: 100 }),
      makeLog({ id: 'l11', jobId: 'j3', date: '2026-05-01', quantity: 1,  amount: 500 }),
    ];
    const result = computeMonthlyReport(logs, [hourlyJob, pieceJob, fixedJob], 2026, 5);
    expect(result.stats).toHaveLength(3);
    expect(result.grandTotal).toBe(720);
  });

  it('計時型 log 缺少 startTime/endTime 時，時數不計但工資仍計入', () => {
    const logs = [
      makeLog({ id: 'l12', jobId: 'j1', date: '2026-05-01', amount: 120 }),
    ];
    const result = computeMonthlyReport(logs, [hourlyJob], 2026, 5);
    expect(result.stats[0].totalMinutes).toBe(0);
    expect(result.stats[0].totalAmount).toBe(120);
  });
});
