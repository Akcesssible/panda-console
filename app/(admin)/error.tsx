'use client'

import { useEffect } from 'react'
import { ErrorView } from '@/components/ui/ErrorView'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AdminError]', error.message, error.digest)
  }, [error])

  return (
    <ErrorView
      title="Something went wrong"
      message="We couldn't load this page. This is usually a temporary database or network issue — try again and it should resolve."
      onRetry={reset}
    />
  )
}
