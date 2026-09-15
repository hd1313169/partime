export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR' | 'UNAUTHORIZED';

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
const PRODUCTION_WORKER_API_BASE_URL = 'https://partime-api-production.wsad71155.workers.dev/api';
const APP_SECRET_STORAGE_KEY = 'salary_tracker_app_secret';

export function getStoredAppSecret(): string | null {
  try {
    return localStorage.getItem(APP_SECRET_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAppSecret(secret: string): void {
  try {
    localStorage.setItem(APP_SECRET_STORAGE_KEY, secret);
  } catch {
    // localStorage unavailable (e.g. private browsing) - secret simply won't persist.
  }
}

export function clearStoredAppSecret(): void {
  try {
    localStorage.removeItem(APP_SECRET_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function normalizeApiBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (!/^https:\/\//i.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname.endsWith('.workers.dev') && (url.pathname === '/' || url.pathname === '')) {
      url.pathname = '/api';
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return trimmed;
  }
}

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
  return normalizeApiBaseUrl(nodeEnv) || normalizeApiBaseUrl(viteEnv) || normalizeApiBaseUrl(getPagesApiFallback()) || '/api';
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
  const storedSecret = getStoredAppSecret();
  const requestInit: RequestInit | undefined = storedSecret
    ? { ...init, headers: { ...init?.headers, 'X-App-Secret': storedSecret } }
    : init;

  const response = await fetch(getResolvedRequestInput(input), requestInit);

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload | ApiSuccessPayload<T>;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAppSecret();
    }
    throw payload;
  }

  return (payload as ApiSuccessPayload<T>).data;
}

export function isUnauthorizedError(payload: unknown): boolean {
  return (payload as Partial<ApiErrorPayload>)?.error?.code === 'UNAUTHORIZED';
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
    case 'UNAUTHORIZED':
      return '請輸入正確的密鑰以解鎖';
    default:
      return '系統忙碌中，請稍後再試';
  }
}
