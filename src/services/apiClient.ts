export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';

export interface ApiErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

interface ApiSuccessPayload<T> {
  data: T;
}

const PAGES_PROJECT_HOST = 'partime-abb.pages.dev';
const PRODUCTION_WORKER_API_BASE_URL = 'https://partime-api-production.wsad71155.workers.dev';

function getPagesApiFallback(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const hostname = window.location.hostname;
  if (hostname === PAGES_PROJECT_HOST || hostname.endsWith(`.${PAGES_PROJECT_HOST}`)) {
    return PRODUCTION_WORKER_API_BASE_URL;
  }

  return undefined;
}

export function getResolvedApiBaseUrl(): string {
  const nodeEnv = typeof process !== 'undefined' ? process.env.VITE_API_BASE_URL : undefined;
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL;
  return nodeEnv?.trim() || viteEnv?.trim() || getPagesApiFallback() || '/api';
}

function getResolvedRequestInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== 'string') {
    return input;
  }

  if (/^(?:[a-z]+:)?\/\//i.test(input)) {
    return input;
  }

  const apiBaseUrl = getResolvedApiBaseUrl().replace(/\/$/, '');
  const defaultApiBase = '/api';

  if (input.startsWith('/api')) {
    if (apiBaseUrl === defaultApiBase) {
      return input;
    }

    const suffix = input.slice('/api'.length);
    const normalizedSuffix = suffix.startsWith('/') || suffix.length === 0 ? suffix : `/${suffix}`;
    return `${apiBaseUrl}${normalizedSuffix}`;
  }

  const path = input.startsWith('/') ? input : `/${input}`;

  return `${apiBaseUrl}${path}`;
}

export async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(getResolvedRequestInput(input), init);

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload | ApiSuccessPayload<T>;

  if (!response.ok) {
    throw payload;
  }

  return (payload as ApiSuccessPayload<T>).data;
}

export function mapApiError(payload: ApiErrorPayload): string {
  if (!payload?.error?.code) {
    return '系統忙碌中，請稍後再試';
  }

  switch (payload.error.code) {
    case 'VALIDATION_ERROR':
      return '資料格式錯誤，請檢查輸入內容';
    case 'NOT_FOUND':
      return '找不到指定資料';
    case 'CONFLICT':
      return '資料衝突，請重新整理後再試';
    default:
      return '系統忙碌中，請稍後再試';
  }
}
