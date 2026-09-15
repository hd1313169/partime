import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DemoFooter } from '../../src/components/DemoFooter';

// Same tree-shaking rationale as demoResetButton.test.tsx: demoMode.ts must stay a
// single inline import.meta.env expression, so the "renders in demo mode" case is
// covered by the build-output check (grep the built demo bundle) instead of a
// vi.stubEnv-based unit test here.
describe('DemoFooter', () => {
  it('renders nothing when not in demo mode', () => {
    const markup = renderToStaticMarkup(<DemoFooter />);
    expect(markup).toBe('');
  });
});
