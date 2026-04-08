'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Tab {
  key: string
  label: string
  count?: number
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  tabs?: Tab[]
  activeTab?: string
  basePath?: string
}

export function PageHeader({
  title,
  subtitle = 'Real-time operational snapshot',
  tabs,
  activeTab,
  basePath,
}: PageHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleTabChange(key: string) {
    if (!basePath) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    params.delete('page')
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between">
      {/* Left — title + subtitle */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1d242d] tracking-[-1px]">{title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      {/* Right — pill tab switcher */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center bg-[#DADFE5] rounded-full p-1 gap-0.5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm rounded-full transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-[#1d242d] font-medium shadow-sm'
                  : 'text-[#3D4C5E] hover:text-[#1d242d]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-[#eef0fb] text-[#2B39C7]'
                    : 'bg-gray-300/60 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
