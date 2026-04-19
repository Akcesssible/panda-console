import Image from 'next/image'

export default function EmailConfirmPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-8">
        <Image src="/panda-logo.svg" alt="Panda Console" width={120} height={40} priority />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md px-4 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Email delivery confirmed!
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            The Panda Console email system is working correctly.
          </p>
          <p className="text-sm text-gray-400">
            You can close this tab.
          </p>
        </div>
      </div>
    </div>
  )
}
