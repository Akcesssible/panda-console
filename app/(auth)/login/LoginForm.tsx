'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loginAction, type AuthActionState } from '@/lib/api/auth'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
    {},
  )

  const searchParams   = useSearchParams()
  const reason         = searchParams.get('reason')
  const sessionExpired = reason === 'session_expired'
  const deactivated    = reason === 'deactivated'
  const passwordChanged = reason === 'password_changed'

  return (
    <div className="w-full max-w-md px-4">
      <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">
        Sign in to Panda Console
      </h1>

      {sessionExpired && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl mb-4 text-center">
          Your session has expired. Please sign in again.
        </p>
      )}

      {deactivated && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-xl mb-4 text-center">
          Your account has been deactivated. Contact your administrator.
        </p>
      )}

      {passwordChanged && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl mb-4 text-center">
          Password updated. Please sign in with your new password.
        </p>
      )}

      <form action={formAction} className="space-y-3">
        {/* Email field */}
        <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
          <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="kevin@pandahailing.com"
            required
            className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Password field */}
        <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
          <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-[#2B39C7] text-white py-3.5 px-4 rounded-2xl text-sm font-medium hover:bg-[#202b95] disabled:opacity-60 transition-colors mt-2 cursor-pointer"
        >
          {pending ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 flex justify-between text-sm text-gray-500">
        <button className="hover:text-gray-800 transition-colors">Reset Password</button>
        <button className="hover:text-gray-800 transition-colors">Contact Support</button>
      </div>
    </div>
  )
}
