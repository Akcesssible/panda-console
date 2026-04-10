'use client'

import Link from 'next/link'

interface ErrorViewProps {
  title?: string
  message?: string
  onRetry?: () => void
  backHref?: string
  backLabel?: string
}

export function ErrorView({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this page. This is usually a temporary database or network issue.',
  onRetry,
  backHref,
  backLabel = 'Go back',
}: ErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Icon */}
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

      {/* Text */}
      <h2 className="text-2xl font-semibold text-[#1d242d] tracking-tight mb-2">{title}</h2>
      <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-8">{message}</p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-[#1d242d] hover:bg-gray-50 transition-colors"
          >
            {backLabel}
          </Link>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-full bg-[#1d242d] text-sm font-medium text-white hover:bg-[#2d3748] transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
