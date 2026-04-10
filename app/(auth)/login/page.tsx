'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason         = searchParams.get('reason')
  const sessionExpired = reason === 'session_expired'
  const deactivated    = reason === 'deactivated'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo — top left */}
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      {/* Form — centered */}
      <div className="flex-1 flex items-center justify-center">
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

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Email field */}
            <div className="bg-[#E8E8E8] rounded-2xl px-4 pt-3 pb-3 border-2 border-transparent focus-within:border-[#1d242d] transition-colors">
              <label className="block font-mono text-xs font-normal text-gray-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-[#1d242d] text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2B39C7] text-white py-3.5 px-4 rounded-2xl text-sm font-medium hover:bg-[#202b95] disabled:opacity-60 transition-colors mt-2 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 flex justify-between text-sm text-gray-500">
            <button className="hover:text-gray-800 transition-colors">Reset Password</button>
            <button className="hover:text-gray-800 transition-colors">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  )
}
