import 'server-only'
import { cookies } from 'next/headers'
import { JWT_COOKIE } from '@/lib/api/jwt'
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  MustChangePasswordError,
  RateLimitError,
} from '@/lib/api/errors'
import type { ApiErrorBody } from '@/lib/api/types'

function baseUrl(): string {
  return process.env.BACKEND_API_URL ?? 'http://localhost:8000'
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  // Pass a token explicitly (e.g. right after login, before the cookie is set).
  token?: string
  // Allow callers to override caching; admin data defaults to no-store.
  cache?: RequestCache
}

async function readToken(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit
  const store = await cookies()
  return store.get(JWT_COOKIE)?.value
}

// Core request: attaches the bearer token, unwraps the ApiResponse envelope,
// and maps non-2xx responses to typed errors.
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, cache = 'no-store' } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  const bearer = await readToken(token)
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
  })

  // 204 No Content / empty body
  const text = await res.text()
  const parsed = text ? safeJson(text) : null

  if (!res.ok) {
    throw toError(res, parsed)
  }

  // Success envelope: { success, message, data, timestamp }. Return `data`.
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    return (parsed as { data: T }).data
  }
  return parsed as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function toError(res: Response, parsed: unknown): ApiError {
  const body = (parsed ?? {}) as Partial<ApiErrorBody>
  const message = body.message || res.statusText || 'Request failed.'

  switch (res.status) {
    case 401:
      return new UnauthorizedError(message)
    case 403:
      if (body.error === 'Password change required') {
        return new MustChangePasswordError(message)
      }
      return new ForbiddenError(message)
    case 429: {
      const retry = Number(res.headers.get('Retry-After'))
      return new RateLimitError(message, Number.isFinite(retry) ? retry : undefined)
    }
    default:
      return new ApiError(message, res.status, body.error)
  }
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
