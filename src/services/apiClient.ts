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

export async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

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
