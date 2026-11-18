import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlyReport } from '../../src/components/MonthlyReport';
import { JobType, WorkLog } from '../../src/types';

beforeAll(() => {
  // recharts ResponsiveContainer needs ResizeObserver in jsdom
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any;
});

const job: JobType = { id: 'j1', name: '早班', calcType: 'PIECE', unitPrice: 10, color: '#ff0000' };
const now = new Date();
const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const logs: WorkLog[] = [{ id: 'l1', jobId: 'j1', date: `${ym}-03`, quantity: 5, amount: 50, unitPriceAtTime: 10 }];

describe('MonthlyReport charts', () => {
  it('預設顯示每日收入 tab，可切換', () => {
    render(<MonthlyReport logs={logs} jobs={[job]} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(t => t.textContent)).toEqual(['每日收入', '各項工作', '近 6 個月']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tabs[1]);
    expect(screen.getByRole('tabpanel').getAttribute('data-chart')).toBe('jobs');
  });

  it('方向鍵切換 tab', () => {
    render(<MonthlyReport logs={logs} jobs={[job]} />);
    fireEvent.keyDown(screen.getAllByRole('tab')[0], { key: 'ArrowLeft' });
    expect(screen.getByRole('tabpanel').getAttribute('data-chart')).toBe('trend');
  });

  it('空月份不顯示圖表，切回有資料月份時保留 tab', () => {
    render(<MonthlyReport logs={logs} jobs={[job]} />);
    fireEvent.click(screen.getAllByRole('tab')[2]);
    fireEvent.click(screen.getByLabelText('上一月'));
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByText(/還沒有工作紀錄/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('下一月'));
    expect(screen.getByRole('tabpanel').getAttribute('data-chart')).toBe('trend');
  });
});
