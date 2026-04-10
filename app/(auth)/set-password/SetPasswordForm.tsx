'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Stage = 'verifying' | 'ready' | 'success' | 'error'

export default function SetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()

  const [stage, setStage] = useState<Stage>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')

  // On mount: exchange the token from the URL for a live session.
  // @supabase/ssr uses PKCE by default → code arrives as ?code= query param.
  // Older/implicit-flow links arrive as #access_token= hash fragments.
  // We handle both so the page works regardless of Supabase project settings.
  useEffect(() => {
    async function exchangeToken() {
      // ── PKCE flow: ?code= in the query string ────────────────────────────
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session) {
          setErrorMsg('This invitation link has expired. Please ask an admin to resend the invite.')
          setStage('error')
          return
        }
        setUserName(data.session.user.user_metadata?.full_name ?? '')
        setStage('ready')
        return
      }

      // ── Implicit flow: #access_token= in the URL hash ────────────────────
      const hash = window.location.hash
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const type = params.get('type')

      if (!accessToken || type !== 'invite') {
        setErrorMsg('This invitation link is invalid or has already been used.')
        setStage('error')
        return
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? '',
      })

      if (error || !data.session) {
        setErrorMsg('This invitation link has expired. Please ask an admin to resend the invite.')
        setStage('error')
        return
      }

      setUserName(data.session.user.user_metadata?.full_name ?? '')
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

    setStage('success')
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  const firstName = userName.split(' ')[0]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">

          {/* Verifying */}
          {stage === 'verifying' && (
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[#2B39C7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Verifying your invitation…</p>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link unavailable</h2>
              <p className="text-sm text-gray-500">{errorMsg}</p>
            </div>
          )}

          {/* Success */}
          {stage === 'success' && (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password set!</h2>
              <p className="text-sm text-gray-500">Taking you to the dashboard…</p>
            </div>
          )}

          {/* Form */}
          {stage === 'ready' && (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
                {firstName ? `Welcome, ${firstName}!` : 'Set your password'}
              </h1>
              <p className="text-sm text-gray-500 text-center mb-8">
                Choose a strong password to activate your Panda Console account.
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
                  {loading ? 'Setting password…' : 'Activate My Account'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
