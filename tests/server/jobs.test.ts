import request from 'supertest';
import { createApp } from '../../server/app';

describe('jobs api', () => {
  it('creates a job', async () => {
    const app = createApp();
    const res = await request(app).post('/api/jobs').send({
      id: 'j1',
      name: '包裝(上午)',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('j1');
  });

  it('rejects invalid calcType', async () => {
    const app = createApp();
    const res = await request(app).post('/api/jobs').send({
      id: 'x',
      name: '錯誤',
      calcType: 'AAA',
      unitPrice: 10,
      color: '#000000',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns conflict for duplicate job id', async () => {
    const app = createApp();

    await request(app).post('/api/jobs').send({
      id: 'j1',
      name: '包裝(上午)',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });

    const duplicate = await request(app).post('/api/jobs').send({
      id: 'j1',
      name: '包裝(下午)',
      calcType: 'HOURLY',
      unitPrice: 220,
      color: '#34d399',
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');
  });

  it('rejects update when path id and body id mismatch', async () => {
    const app = createApp();

    await request(app).post('/api/jobs').send({
      id: 'j1',
      name: '包裝(上午)',
      calcType: 'HOURLY',
      unitPrice: 210,
      color: '#10b981',
    });

    const res = await request(app).put('/api/jobs/j1').send({
      id: 'j2',
      name: '包裝(下午)',
      calcType: 'HOURLY',
      unitPrice: 220,
      color: '#34d399',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns not found when deleting missing job', async () => {
    const app = createApp();

    const res = await request(app).delete('/api/jobs/no-job');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
