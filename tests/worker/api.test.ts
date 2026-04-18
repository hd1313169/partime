import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

describe('worker api smoke', () => {
  it('fails until worker entrypoint is implemented', async () => {
    const require = createRequire(import.meta.url);
    const loadWorkerEntrypoint = () => require('../../worker/index');
    expect(loadWorkerEntrypoint).not.toThrow();
  });
});
