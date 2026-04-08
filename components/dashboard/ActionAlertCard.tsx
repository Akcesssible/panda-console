import Link from 'next/link'

interface Props {
  title: string
  count: number
  unit: string
  description: string
  badge?: string
  ctaLabel: string
  ctaHref: string
}

export function ActionAlertCard({ title, count, unit, description, badge, ctaLabel, ctaHref }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-[#1d242d]">{title}</span>
        <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
        </svg>
      </div>

      <div>
        <p className="text-4xl font-bold text-[#1d242d]">{count.toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
        {badge && (
          <span className="inline-flex mt-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      <Link
        href={ctaHref}
        className="flex items-center justify-between bg-[#1d242d] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#2a3340] transition-colors"
      >
        {ctaLabel}
        <svg className="w-4 h-4 opacity-60" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
        </svg>
      </Link>
    </div>
  )
}
