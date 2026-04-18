/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../../src/App';
import { salaryApi } from '../../src/services/salaryApi';

// Mock salaryApi
vi.mock('../../src/services/salaryApi', () => ({
  salaryApi: {
    getBootstrap: vi.fn(),
    setWeeklyPrice: vi.fn(),
    createLog: vi.fn(),
    updateLog: vi.fn(),
    deleteLog: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
  },
}));

describe('App Shell Layout - Width and Contrast Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders App component with required CSS hooks for layout', () => {
    // Mock the bootstrap API to return empty data
    (salaryApi.getBootstrap as ReturnType<typeof vi.fn>).mockResolvedValue({
      jobs: [],
      logs: [],
      weeklyPrices: {},
    });

    // Use renderToStaticMarkup to generate HTML
    const markup = renderToStaticMarkup(<App />);

    // Assert the markup contains the required CSS class hooks
    expect(markup).toContain('app-shell-wide');
    expect(markup).toContain('app-topbar');
    expect(markup).toContain('button-secondary-strong');
  });
});

