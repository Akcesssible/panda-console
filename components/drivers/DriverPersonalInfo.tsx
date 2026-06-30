import { formatDate } from '@/lib/utils'
import type { Driver, DriverDocument } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'

const DOC_TYPES = ['NATIONAL_ID', 'DRIVING_LICENSE', 'VEHICLE_REGISTRATION', 'VEHICLE_INSURANCE', 'PROFILE_PHOTO', 'SELFIE', 'VEHICLE_PHOTO']
const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: 'National ID',
  DRIVING_LICENSE: 'Driving License',
  VEHICLE_REGISTRATION: 'Vehicle Registration',
  VEHICLE_INSURANCE: 'Vehicle Insurance',
  PROFILE_PHOTO: 'Profile Photo',
  SELFIE: 'Selfie',
  VEHICLE_PHOTO: 'Vehicle Photo',
}

export function DriverPersonalInfo({ driver, documents }: { driver: Driver; documents: DriverDocument[] }) {
  const uploadedDocTypes = new Set(documents.map(d => d.doc_type))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Personal Info</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <InfoRow label="Full Name" value={driver.full_name} />
        <InfoRow label="Email" value={driver.email ?? '—'} />
        <InfoRow label="Phone" value={driver.phone} />
        <InfoRow label="Date of Birth" value={formatDate(driver.date_of_birth)} />
        <InfoRow label="National ID" value={driver.national_id ?? '—'} />
        <InfoRow label="Emergency Contact" value={driver.emergency_contact_name ?? '—'} />
        <InfoRow label="Emergency Phone" value={driver.emergency_contact_phone ?? '—'} />
        <InfoRow label="Address" value={driver.address ?? '—'} />
        <InfoRow label="Driver Number" value={driver.driver_number} />
        <InfoRow
          label="Identity Verification"
          value={driver.identity_verification
            ? driver.identity_verification.status.replace('_', ' ')
            : '—'}
        />
        <InfoRow
          label="Face Match Score"
          value={driver.identity_verification?.face_match_score != null
            ? `${Math.round(driver.identity_verification.face_match_score * 100)}%`
            : '—'}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Documents & Verification</h3>
        <div className="space-y-2">
          {DOC_TYPES.map(type => {
            const uploaded = uploadedDocTypes.has(type)
            const doc = documents.find(d => d.doc_type === type)
            const status = doc?.verification_status ?? (doc?.is_verified ? 'verified' : uploaded ? 'pending' : 'missing')
            return (
              <div key={type} className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-sm text-gray-600">{DOC_LABELS[type] ?? type}</span>
                  {doc?.uploaded_at && (
                    <p className="text-xs text-gray-400 mt-0.5">Uploaded {formatDate(doc.uploaded_at)}</p>
                  )}
                  {doc?.rejection_reason && (
                    <p className="text-xs text-red-500 mt-0.5">{doc.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    status === 'verified' ? 'green'
                      : status === 'rejected' ? 'red'
                        : uploaded ? 'yellow' : 'gray'
                  }>
                    {status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : uploaded ? 'Uploaded' : 'Missing'}
                  </Badge>
                  {doc?.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary$ hover:text-primary-dark$"
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
