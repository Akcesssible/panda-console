'use client'

import { useEffect } from 'react'
import { ErrorView } from '@/components/ui/ErrorView'

export default function TicketDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[TicketDetailError]', error.message, error.digest)
  }, [error])

  return (
    <ErrorView
      title="Could not load ticket"
      message="There was a problem fetching this support ticket. Check your connection and try again, or go back to the support queue."
      onRetry={reset}
      backHref="/support"
      backLabel="Back to Support"
    />
  )
}
