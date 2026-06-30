'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { changePasswordAction, type AuthActionState } from '@/lib/api/auth'

export default function SetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    changePasswordAction,
    {},
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
            Set your password
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Enter the temporary password from your invite, then choose a new one
            to activate your Panda Console account.
          </p>

          <form action={formAction} className="space-y-3">
            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                name="currentPassword"
                placeholder="From your invite email"
                required
                className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Minimum 8 characters"
                required
                className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm"
                placeholder="Repeat your new password"
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
              className="w-full bg-[#2B39C7] text-white py-3.5 px-4 rounded-2xl text-sm font-medium hover:bg-[#202b95] disabled:opacity-50 transition-colors mt-2 cursor-pointer"
            >
              {pending ? 'Setting password…' : 'Activate My Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
