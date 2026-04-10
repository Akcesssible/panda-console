'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error.message, error.digest)
  }, [error])

  return (
    <html lang="en">
      <body className="font-sans bg-[#F0F2F5]">
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 9v6M14 19h.01M6.34 6.34C3.22 9.46 2 12.07 2 14c0 6.63 5.37 12 12 12s12-5.37 12-12S20.63 2 14 2c-1.93 0-4.54 1.22-7.66 4.34z"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-[#1d242d] tracking-tight mb-2">Application error</h2>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-8">
            Panda Console encountered an unexpected error. Refreshing the page usually resolves this.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-full bg-[#1d242d] text-sm font-medium text-white hover:bg-[#2d3748] transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
