'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { JWT_COOKIE, decodeClaims } from '@/lib/api/jwt'
import { ApiError } from '@/lib/api/errors'
import type { AuthResponse } from '@/lib/api/types'

export interface AuthActionState {
  error?: string
}

async function setJwtCookie(token: string, expiresIn: number) {
  const store = await cookies()
  store.set(JWT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  })
}

async function clearJwtCookie() {
  const store = await cookies()
  store.delete(JWT_COOKIE)
}

// POST /api/v1/auth/admin/login → set httpOnly JWT cookie → redirect.
export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  let mustChangePassword = false
  try {
    const auth = await api.post<AuthResponse>(paths.adminLogin, { email, password })
    await setJwtCookie(auth.token, auth.expiresIn)
    mustChangePassword = decodeClaims(auth.token)?.mcp ?? false
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
      return { error: 'Invalid email or password.' }
    }
    return { error: e instanceof ApiError ? e.message : 'Unable to sign in. Please try again.' }
  }

  // redirect() throws — must run outside the try/catch above.
  redirect(mustChangePassword ? '/set-password' : '/dashboard')
}

// POST /api/v1/auth/admin/change-password using the current (temp) token.
// On success the temp token is stale, so we clear it and force a fresh login.
export async function changePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (newPassword.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (newPassword !== confirm) return { error: 'Passwords do not match.' }

  try {
    await api.post<void>(paths.adminChangePassword, { currentPassword, newPassword })
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Unable to change password.' }
  }

  await clearJwtCookie()
  redirect('/login?reason=password_changed')
}

// POST /api/v1/auth/admin/logout (best effort) → clear cookie → redirect.
export async function logoutAction() {
  try {
    await api.post<void>(paths.adminLogout)
  } catch {
    // Token may already be invalid; clear the cookie regardless.
  }
  await clearJwtCookie()
  redirect('/login')
}
