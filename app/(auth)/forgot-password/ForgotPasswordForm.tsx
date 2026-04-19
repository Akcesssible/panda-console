'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Stage = 'form' | 'sent'

export default function ForgotPasswordForm() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [stage, setStage]   = useState<Stage>('form')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      return
    }

    setStage('sent')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4">

          {stage === 'sent' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">Check your inbox</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                If <strong className="text-gray-700">{email}</strong> is linked to an active account,
                you'll receive a password reset email shortly.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                The link expires in <strong>1 hour</strong>. Check your spam folder if you don't see it.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-[#2B39C7] hover:underline"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  ← Back to login
                </Link>
              </div>

              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Forgot your password?</h1>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Enter the email address on your Panda Console account and we'll send you
                a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
                  <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@pandahailing.com"
                    required
                    className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#2B39C7] text-white py-3.5 px-4 rounded-2xl text-sm font-medium hover:bg-[#202b95] disabled:opacity-50 transition-colors mt-2 cursor-pointer"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
