'use client'

import { useEffect } from 'react'
import { ErrorView } from '@/components/ui/ErrorView'

export default function DriverDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DriverDetailError]', error.message, error.digest)
  }, [error])

  return (
    <ErrorView
      title="Could not load driver profile"
      message="There was a problem fetching this driver's data. Check your connection and try again, or go back to the drivers list."
      onRetry={reset}
      backHref="/drivers"
      backLabel="Back to Drivers"
    />
  )
}
