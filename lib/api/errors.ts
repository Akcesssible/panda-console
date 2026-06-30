// Typed errors thrown by the backend API client (lib/api/client.ts).
// Callers (server components, route handlers, server actions) catch these to
// drive redirects (401 -> /login) or surface messages to the UI.

export class ApiError extends Error {
  readonly status: number
  readonly backendError?: string

  constructor(message: string, status: number, backendError?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.backendError = backendError
  }
}

// 401 — token missing, expired, revoked, or invalid signature.
export class UnauthorizedError extends ApiError {
  constructor(message = 'Your session has expired. Please sign in again.') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

// 403 with backend error "Password change required" — temp-password admin must
// change their password before using the system.
export class MustChangePasswordError extends ApiError {
  constructor(message = 'You must change your temporary password before continuing.') {
    super(message, 403, 'Password change required')
    this.name = 'MustChangePasswordError'
  }
}

// 403 — authenticated but lacks the required role/authority.
export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

// 429 — gateway rate limit hit. Carries the Retry-After seconds when present.
export class RateLimitError extends ApiError {
  readonly retryAfter?: number

  constructor(message = 'Too many requests — please slow down and try again shortly.', retryAfter?: number) {
    super(message, 429)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}
