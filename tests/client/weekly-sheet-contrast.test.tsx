/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WeeklySheet } from '../../src/components/WeeklySheet';
import { JobType, WorkLog } from '../../src/types';

describe('WeeklySheet Contrast - Width and Contrast Hooks', () => {
  it('renders WeeklySheet component with required CSS hooks for contrast', async () => {
    // Minimal valid props for WeeklySheet
    const jobs: JobType[] = [
      {
        id: 'job-1',
        name: 'Test Job',
        calcType: 'HOURLY',
        unitPrice: 250,
        color: 'emerald',
      },
    ];

    const logs: WorkLog[] = [];
    const currentDate = new Date('2026-04-18');
    const weeklyPrices: Record<string, number> = {
      'job-1': 250,
    };

    // Create mock callbacks
    const mockOnUpdateWeeklyPrice = () => {};
    const mockOnCellClick = () => {};
    const mockOnGenerateReport = () => {};

    // Use renderToStaticMarkup to generate HTML
    const markup = renderToStaticMarkup(
      WeeklySheet({
        logs,
        jobs,
        currentDate,
        weeklyPrices,
        onUpdateWeeklyPrice: mockOnUpdateWeeklyPrice,
        onCellClick: mockOnCellClick,
        onGenerateReport: mockOnGenerateReport,
      })
    );

    // Assert the markup contains the required CSS class hooks
    expect(markup).toContain('mobile-day-card-header');
    expect(markup).toContain('desktop-weekly-head');
    expect(markup).toContain('desktop-weekly-sticky-total');
  });
});
