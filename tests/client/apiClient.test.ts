import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  clearStoredAppSecret,
  getResolvedApiBaseUrl,
  getStoredAppSecret,
  isUnauthorizedError,
  mapApiError,
  setStoredAppSecret,
} from '../../src/services/apiClient';

describe('api client error mapping', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('uses same-origin /api base by default', () => {
    const baseUrl = getResolvedApiBaseUrl();
    expect(baseUrl).toBe('/api');
  });

  it('routes relative path to /api by default', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    await apiRequest('jobs');

    expect(fetchMock).toHaveBeenCalledWith('/api/jobs', undefined);
  });

  it('does not rewrite absolute url', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { ok: true } }), { status: 200 }));

    await apiRequest('https://example.com/api/health');

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/health', undefined);
  });

  it('rewrites /api path when VITE_API_BASE_URL is configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/v1/');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    await apiRequest('/api/jobs');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/jobs', undefined);
  });

  it('normalizes workers base url to include /api path', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://partime-api-production.wsad71155.workers.dev');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    await apiRequest('/api/bootstrap');

    expect(fetchMock).toHaveBeenCalledWith('https://partime-api-production.wsad71155.workers.dev/api/bootstrap', undefined);
  });

  it('maps VALIDATION_ERROR into readable message', () => {
    const msg = mapApiError({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payload',
      },
    });

    expect(msg).toBe('資料格式錯誤，請檢查輸入內容');
  });

  describe('shared secret handling', () => {
    afterEach(() => {
      clearStoredAppSecret();
    });

    it('attaches X-App-Secret header when a secret is stored', async () => {
      setStoredAppSecret('my-secret');
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      await apiRequest('/api/jobs');

      expect(fetchMock).toHaveBeenCalledWith('/api/jobs', { headers: { 'X-App-Secret': 'my-secret' } });
    });

    it('does not attach a header when no secret is stored', async () => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      await apiRequest('/api/jobs');

      expect(fetchMock).toHaveBeenCalledWith('/api/jobs', undefined);
    });

    it('clears the stored secret and rejects with an UNAUTHORIZED payload on a 401 response', async () => {
      setStoredAppSecret('stale-secret');
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), { status: 401 }),
      );

      await expect(apiRequest('/api/jobs')).rejects.toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      });

      expect(getStoredAppSecret()).toBeNull();
    });

    it('isUnauthorizedError identifies an UNAUTHORIZED payload', () => {
      expect(isUnauthorizedError({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } })).toBe(true);
      expect(isUnauthorizedError({ error: { code: 'VALIDATION_ERROR', message: 'Bad' } })).toBe(false);
      expect(isUnauthorizedError(null)).toBe(false);
    });
  });
});
