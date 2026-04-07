import request from 'supertest';
import { createApp } from '../../server/app';

describe('bootstrap api', () => {
  it('returns jobs logs weeklyPrices object', async () => {
    const app = createApp();

    await request(app).post('/api/jobs').send({
      id: 'j1',
      name: '包裝(上午)',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });

    await request(app).put('/api/weekly-prices/2026-04-07').send({
      jobId: 'j1',
      unitPrice: 220,
    });

    const res = await request(app).get('/api/bootstrap');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('jobs');
    expect(res.body.data).toHaveProperty('logs');
    expect(res.body.data).toHaveProperty('weeklyPrices');
    expect(res.body.data.weeklyPrices['2026-04-07'].j1).toBe(220);
  });
});
