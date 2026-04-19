'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordForm() {
  const router  = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">

          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500">Taking you to the dashboard…</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
                Change your password
              </h1>
              <p className="text-sm text-gray-500 text-center mb-8">
                Choose a strong password to replace your temporary one.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
                  <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrorMsg('') }}
                    placeholder="Minimum 8 characters"
                    required
                    className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
                  <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setErrorMsg('') }}
                    placeholder="Repeat your password"
                    required
                    className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full bg-[#2B39C7] text-white py-3.5 px-4 rounded-2xl text-sm font-medium hover:bg-[#202b95] disabled:opacity-50 transition-colors mt-2 cursor-pointer"
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
