import { Suspense } from 'react'
import Image from 'next/image'
import { LoginForm } from './LoginForm'

// Fallback shown while LoginForm resolves useSearchParams()
function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md px-4 animate-pulse">
      <div className="h-9 bg-gray-200 rounded-xl w-3/4 mx-auto mb-8" />
      <div className="space-y-3">
        <div className="h-16 bg-gray-200 rounded-2xl" />
        <div className="h-16 bg-gray-200 rounded-2xl" />
        <div className="h-12 bg-gray-200 rounded-2xl mt-2" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo — top left */}
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      {/* Form — centered */}
      <div className="flex-1 flex items-center justify-center">
        {/*
          Suspense is required here because LoginForm calls useSearchParams().
          Next.js prerendering cannot read URL search params at build time, so
          useSearchParams() must be deferred behind a Suspense boundary.
          The fallback renders a matching skeleton so there is no layout shift.
        */}
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
