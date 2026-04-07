import request from 'supertest';
import { createApp } from '../../server/app';

describe('logs api', () => {
  it('creates and deletes a log', async () => {
    const app = createApp();

    await request(app).post('/api/jobs').send({
      id: 'j1',
      name: '包裝(上午)',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });

    const create = await request(app).post('/api/logs').send({
      id: 'l1',
      jobId: 'j1',
      date: '2026-04-07',
      startTime: '08:00',
      endTime: '12:00',
      amount: 840,
      unitPriceAtTime: 210,
    });

    expect(create.status).toBe(201);
    expect(create.body.data.id).toBe('l1');

    const del = await request(app).delete('/api/logs/l1');
    expect(del.status).toBe(204);
  });
});
