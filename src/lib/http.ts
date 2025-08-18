import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as any, { status: 200, ...(init || {}) });
}

export type ErrorBody = { error: string; code?: string; details?: unknown };

export function error(status: number, message: string, code?: string, details?: unknown) {
  return NextResponse.json({ error: message, code, details } as ErrorBody, { status });
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class BadRequest extends ApiError {
  constructor(message = 'Bad Request', details?: unknown, code = 'BAD_REQUEST') { super(400, message, code, details); }
}
export class Unauthorized extends ApiError {
  constructor(message = 'Unauthorized', details?: unknown, code = 'UNAUTHORIZED') { super(401, message, code, details); }
}
export class Forbidden extends ApiError {
  constructor(message = 'Forbidden', details?: unknown, code = 'FORBIDDEN') { super(403, message, code, details); }
}
export class NotFound extends ApiError {
  constructor(message = 'Not Found', details?: unknown, code = 'NOT_FOUND') { super(404, message, code, details); }
}
export class TooManyRequests extends ApiError {
  retryAfter?: number;
  constructor(message = 'Too Many Requests', retryAfter?: number, details?: unknown, code = 'RATE_LIMITED') {
    super(429, message, code, details);
    this.retryAfter = retryAfter;
  }
}
