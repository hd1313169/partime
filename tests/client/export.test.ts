import { describe, it, expect } from 'vitest';
import { buildMonthRows } from '../../src/utils/export';
import { JobType, WorkLog } from '../../src/types';

const jobHourly: JobType = {
  id: 'j1',
  name: '搬運',
  calcType: 'HOURLY',
  unitPrice: 200,
  color: '#ff0000',
};

const jobPiece: JobType = {
  id: 'j2',
  name: '包裝',
  calcType: 'PIECE',
  unitPrice: 70,
  color: '#00ff00',
};

// 2026-05-01 = 五（Friday），2026-05-03 = 日（Sunday）
const logs: WorkLog[] = [
  {
    id: 'l1',
    jobId: 'j1',
    date: '2026-05-01',
    startTime: '09:00',
    endTime: '12:00', // 180 min → 3h
    amount: 600,
    unitPriceAtTime: 200,
  },
  {
    id: 'l2',
    jobId: 'j2',
    date: '2026-05-02',
    quantity: 10,
    amount: 700,
    unitPriceAtTime: 70,
  },
];

describe('buildMonthRows', () => {
  it('produces correct header row', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    expect(rows[0]).toEqual(['日期', '星期', '搬運', '包裝', '當日合計']);
  });

  it('renders daily rows with correct weekday and values', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    // rows[1] = 05/01（五）
    expect(rows[1]).toEqual(['05/01', '五', '3h', '-', 'NT$600']);
    // rows[2] = 05/02（六）
    expect(rows[2]).toEqual(['05/02', '六', '-', '10件', 'NT$700']);
    // rows[3] = 05/03（日）無 log
    expect(rows[3]).toEqual(['05/03', '日', '-', '-', '-']);
  });

  it('inserts week total row after Sunday', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    // rows[0]=header, rows[1..3]=05/01~05/03, rows[4]=week total
    expect(rows[4][0]).toBe('▸ 週合計');
    expect(rows[4][2]).toBe('3h');     // 搬運週合計
    expect(rows[4][3]).toBe('10件');  // 包裝週合計
    expect(rows[4][4]).toBe('NT$1,300'); // 600 + 700
  });

  it('applies Math.ceil to partial hours', () => {
    const partialLog: WorkLog = {
      id: 'l3',
      jobId: 'j1',
      date: '2026-05-04',
      startTime: '09:00',
      endTime: '09:30', // 30 min → ceil(0.5) = 1h
      amount: 200,
      unitPriceAtTime: 200,
    };
    const rows = buildMonthRows([partialLog], [jobHourly], 2026, 5);
    const may4Row = rows.find(r => r[0] === '05/04');
    expect(may4Row?.[2]).toBe('1h');
  });

  it('handles empty month: header + week totals + month total only', () => {
    const rows = buildMonthRows([], [jobHourly, jobPiece], 2026, 5);
    expect(rows[0]).toEqual(['日期', '星期', '搬運', '包裝', '當日合計']);
    expect(rows[rows.length - 1][0]).toBe('▸ 月合計');
  });

  it('month total is last row with correct grand total', () => {
    const rows = buildMonthRows(logs, [jobHourly, jobPiece], 2026, 5);
    const lastRow = rows[rows.length - 1];
    expect(lastRow[0]).toBe('▸ 月合計');
    expect(lastRow[2]).toBe('3h');     // 搬運月合計
    expect(lastRow[3]).toBe('10件');  // 包裝月合計
    expect(lastRow[4]).toBe('NT$1,300');
  });
});
