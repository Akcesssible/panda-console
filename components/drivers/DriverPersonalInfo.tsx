import { formatDate } from '@/lib/utils'
import type { Driver, DriverDocument } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'

const DOC_TYPES = ['national_id', 'driving_license', 'vehicle_reg', 'psv_badge', 'vehicle_image']
const DOC_LABELS: Record<string, string> = {
  national_id: 'National ID',
  driving_license: 'Driving License',
  vehicle_reg: 'Vehicle Registration',
  psv_badge: 'PSV Badge',
  vehicle_image: 'Vehicle Image',
}

export function DriverPersonalInfo({ driver, documents }: { driver: Driver; documents: DriverDocument[] }) {
  const uploadedDocTypes = new Set(documents.map(d => d.doc_type))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Personal Info</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <InfoRow label="Email" value={driver.email ?? '—'} />
        <InfoRow label="Phone" value={driver.phone} />
        <InfoRow label="Date of Birth" value={formatDate(driver.date_of_birth)} />
        <InfoRow label="National ID" value={driver.national_id ?? '—'} />
        <InfoRow label="Emergency Contact" value={driver.emergency_contact_name ?? '—'} />
        <InfoRow label="Emergency Phone" value={driver.emergency_contact_phone ?? '—'} />
      </div>

      {/* Documents */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Documents</h3>
        <div className="space-y-2">
          {DOC_TYPES.map(type => {
            const uploaded = uploadedDocTypes.has(type)
            const doc = documents.find(d => d.doc_type === type)
            return (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{DOC_LABELS[type] ?? type}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={uploaded ? (doc?.is_verified ? 'green' : 'yellow') : 'red'}>
                    {uploaded ? (doc?.is_verified ? 'Verified' : 'Uploaded') : 'Missing'}
                  </Badge>
                  {doc?.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}
