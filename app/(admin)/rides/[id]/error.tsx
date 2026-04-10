'use client'

import { useEffect } from 'react'
import { ErrorView } from '@/components/ui/ErrorView'

export default function RideDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RideDetailError]', error.message, error.digest)
  }, [error])

  return (
    <ErrorView
      title="Could not load ride details"
      message="There was a problem fetching this ride's data. Check your connection and try again, or go back to the rides list."
      onRetry={reset}
      backHref="/rides"
      backLabel="Back to Rides"
    />
  )
}
