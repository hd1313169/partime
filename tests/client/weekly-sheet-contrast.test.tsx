/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
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

    // Create a container for rendering
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      // Use React's createRoot to render the component
      const root = createRoot(container);
      root.render(
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

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the HTML markup
      const markup = container.innerHTML;

      // Assert the markup contains the required CSS class hooks
      expect(markup).toContain('mobile-day-card-header');
      expect(markup).toContain('desktop-weekly-head');
      expect(markup).toContain('desktop-weekly-sticky-total');

      // Cleanup
      root.unmount();
    } finally {
      document.body.removeChild(container);
    }
  });
});
