import request from 'supertest';
import { createApp } from '../../server/app';

describe('GET /api/health', () => {
  it('returns ok payload', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });
});
