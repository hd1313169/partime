/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import App from '../../src/App';
import { salaryApi } from '../../src/services/salaryApi';
import React from 'react';

// Mock salaryApi
vi.mock('../../src/services/salaryApi', () => ({
  salaryApi: {
    getBootstrap: vi.fn(),
  },
}));

describe('App Shell Layout - Width and Contrast Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders App component with required CSS hooks for layout', async () => {
    // Mock the bootstrap API to return empty data
    (salaryApi.getBootstrap as any).mockResolvedValue({
      jobs: [],
      logs: [],
      weeklyPrices: {},
    });

    // Create a container for rendering
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      // Use React's createRoot to render the component
      const root = createRoot(container);
      root.render(React.createElement(App));

      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the HTML markup
      const markup = container.innerHTML;

      // Assert the markup contains the required CSS class hooks
      expect(markup).toContain('app-shell-wide');
      expect(markup).toContain('app-topbar');
      expect(markup).toContain('button-secondary-strong');

      // Cleanup
      root.unmount();
    } finally {
      document.body.removeChild(container);
    }
  });
});

