/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklySheet } from '../../src/components/WeeklySheet';
import { JobType, WorkLog } from '../../src/types';

describe('WeeklySheet Contrast - Width and Contrast Hooks', () => {
  it('renders WeeklySheet component with required CSS hooks for contrast', () => {
    // Minimal valid props for WeeklySheet
    const jobs: JobType[] = [
      {
        id: 'job-1',
        name: 'Test Job',
        calcType: 'HOURLY',
        unitPrice: 250,
        color: '#22c55e',
      },
    ];

    const logs: WorkLog[] = [];
    const currentDate = new Date('2026-04-18');
    const weeklyPrices: Record<string, number> = {
      'job-1': 250,
    };

    // Create mock callbacks
    const mockOnUpdateWeeklyPrice = vi.fn();
    const mockOnCellClick = vi.fn();
    const mockOnGenerateReport = vi.fn();

    // Use renderToStaticMarkup to generate HTML
    const markup = renderToStaticMarkup(
      <WeeklySheet
        logs={logs}
        jobs={jobs}
        currentDate={currentDate}
        weeklyPrices={weeklyPrices}
        onUpdateWeeklyPrice={mockOnUpdateWeeklyPrice}
        onCellClick={mockOnCellClick}
        onGenerateReport={mockOnGenerateReport}
      />
    );

    // Assert the markup contains the required CSS class hooks
    expect(markup).toContain('mobile-day-card-header');
    expect(markup).toContain('desktop-weekly-head');
    expect(markup).toContain('desktop-weekly-sticky-total');
  });

  describe('generateReportText - 依 jobs 順序輸出', () => {
    it('回報文字的行序應與 jobs 陣列順序一致，而非 logs 順序', () => {

      const jobs: JobType[] = [
        { id: 'j-a', name: '工作A', calcType: 'PIECE', unitPrice: 10, color: '#aaa' },
        { id: 'j-b', name: '工作B', calcType: 'PIECE', unitPrice: 20, color: '#bbb' },
      ];

      // logs 順序刻意與 jobs 顛倒：j-b 先，j-a 後
      const logs: WorkLog[] = [
        { id: 'l2', jobId: 'j-b', date: '2026-04-20', quantity: 3, amount: 60, unitPriceAtTime: 20 },
        { id: 'l1', jobId: 'j-a', date: '2026-04-20', quantity: 5, amount: 50, unitPriceAtTime: 10 },
      ];

      const weeklyPrices: Record<string, number> = { 'j-a': 10, 'j-b': 20 };
      const capturedText: string[] = [];

      render(
        <WeeklySheet
          logs={logs}
          jobs={jobs}
          currentDate={new Date('2026-04-20')}
          weeklyPrices={weeklyPrices}
          onUpdateWeeklyPrice={vi.fn()}
          onCellClick={vi.fn()}
          onGenerateReport={(text) => capturedText.push(text)}
        />
      );

      // 找到 04/20 當天的回報按鈕並點擊
      const reportButton = screen.getAllByTitle('生成回報文字')[0];
      expect(reportButton).toBeDefined();
      fireEvent.click(reportButton);

      expect(capturedText).toHaveLength(1);
      const lines = capturedText[0].split('\n');
      // 第一行是日期
      expect(lines[0]).toBe('04/20');
      // 第二行應是 jobs[0]（工作A），不是 logs 裡先出現的工作B
      expect(lines[1]).toMatch(/^工作A/);
      // 第三行應是 jobs[1]（工作B）
      expect(lines[2]).toMatch(/^工作B/);
    });
  });
});
