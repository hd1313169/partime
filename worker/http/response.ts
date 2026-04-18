import { AppError } from '../../server/http/error';

export function ok<T>(data: T, init: ResponseInit = {}): Response {
  return Response.json({ data }, { status: 200, ...init });
}

export function fail(code: string, message: string, status = 500, details?: unknown): Response {
  const body: { error: { code: string; message: string; details?: unknown } } = {
    error: { code, message },
  };
  if (details !== undefined) {
    body.error.details = details;
  }
  return Response.json(body, { status });
}

export function fromAppError(err: AppError): Response {
  return fail(err.code, err.message, err.status, err.details);
}
