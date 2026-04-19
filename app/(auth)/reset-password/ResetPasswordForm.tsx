'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Stage = 'verifying' | 'ready' | 'success' | 'error'

export default function ResetPasswordForm() {
  const supabase = createClient()

  const [stage, setStage]     = useState<Stage>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)

  // Exchange the token from the email link for a live session.
  // Supabase PKCE flow puts ?code= in the query string.
  // Implicit flow puts #access_token= in the hash.
  useEffect(() => {
    async function exchangeToken() {
      // ── PKCE flow ────────────────────────────────────────────────────────
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session) {
          setErrorMsg('This reset link has expired or already been used. Please request a new one.')
          setStage('error')
          return
        }
        setStage('ready')
        return
      }

      // ── Implicit flow ─────────────────────────────────────────────────────
      const hash   = window.location.hash
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type         = params.get('type')

      if (!accessToken || type !== 'recovery') {
        setErrorMsg('This reset link is invalid. Please request a new one from the login page.')
        setStage('error')
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? '',
      })

      if (error) {
        setErrorMsg('This reset link has expired or already been used. Please request a new one.')
        setStage('error')
        return
      }

      setStage('ready')
    }

    exchangeToken()
  }, [supabase])

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

    // Sign out so the user logs in fresh with their new password
    await supabase.auth.signOut()
    setStage('success')
    setTimeout(() => { window.location.href = '/login?reason=password_reset' }, 2500)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">

          {/* Verifying */}
          {stage === 'verifying' && (
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[#2B39C7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Verifying your reset link…</p>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link unavailable</h2>
              <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
              <a
                href="/forgot-password"
                className="inline-block bg-[#2B39C7] text-white text-sm font-medium px-6 py-3 rounded-2xl hover:bg-[#202b95] transition-colors"
              >
                Request a new link
              </a>
            </div>
          )}

          {/* Success */}
          {stage === 'success' && (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500">Taking you to the login page…</p>
            </div>
          )}

          {/* Form */}
          {stage === 'ready' && (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Create new password</h1>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Choose a strong password. You'll use it to sign in to Panda Console.
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
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setErrorMsg('') }}
                    placeholder="Repeat your new password"
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
                  {loading ? 'Updating…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
