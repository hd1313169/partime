import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, getResolvedApiBaseUrl, mapApiError } from '../../src/services/apiClient';

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
});
