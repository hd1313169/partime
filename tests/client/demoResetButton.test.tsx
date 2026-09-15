import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DemoResetButton } from '../../src/components/DemoResetButton';

// demoMode.ts reads import.meta.env.VITE_DEMO_MODE as a single inline expression
// (not via process.env) so vite build --mode demo can statically tree-shake the
// unused real salaryApi/apiClient branch out of the demo bundle entirely (verified
// by grepping the actual `npm run build:demo` output for "/api" and the production
// Worker URL - both absent). That same static replacement means the value is fixed
// per test run and can't be flipped with vi.stubEnv/import.meta.env mutation here,
// so the "renders in demo mode" case is covered by that build-output check instead
// of a unit test.
describe('DemoResetButton', () => {
  it('renders nothing when not in demo mode', () => {
    const markup = renderToStaticMarkup(<DemoResetButton />);
    expect(markup).toBe('');
  });
});
