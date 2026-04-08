interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  trend?: { value: string; positive?: boolean }
}

export function KPICard({ label, value, sub, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      {trend && (
        <p className={`text-xs font-medium mt-2 ${trend.positive !== false ? 'text-green-600' : 'text-red-600'}`}>
          {trend.value}
        </p>
      )}
    </div>
  )
}
