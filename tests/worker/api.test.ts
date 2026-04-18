import { describe, expect, it } from 'vitest';

describe('worker api smoke', () => {
  it('exposes /api/health', async () => {
    const app = null as unknown as { request: (url: string) => Promise<Response> };
    const res = await app.request('http://localhost/api/health');
    expect(res.status).toBe(200);
  });
});
