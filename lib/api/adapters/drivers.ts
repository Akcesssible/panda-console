import type { Driver, DriverDocument, Vehicle, DriverStatus } from '@/lib/types'
import type { BackendDriverDocument, BackendDriverProfile } from '@/lib/api/types'

const STATUS_MAP: Record<BackendDriverProfile['status'], DriverStatus> = {
  ONBOARDING:       'pending',
  PENDING_APPROVAL: 'pending',
  ACTIVE:           'active',
  REJECTED:         'churned',
  SUSPENDED:        'suspended',
}

function buildFullName(p: BackendDriverProfile): string {
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ').trim() || p.phone
}

function documentUrls(
  docs: BackendDriverDocument[],
  type: BackendDriverDocument['type'],
): string[] {
  return docs
    .filter(doc => doc.type === type && Boolean(doc.fileUrl))
    .map(doc => documentProxyUrl(doc.id))
}

function documentLabel(type: BackendDriverDocument['type']): string {
  const labels: Record<BackendDriverDocument['type'], string> = {
    NATIONAL_ID: 'National ID',
    DRIVING_LICENSE: 'Driving License',
    VEHICLE_REGISTRATION: 'Vehicle Registration',
    VEHICLE_INSURANCE: 'Vehicle Insurance',
    PROFILE_PHOTO: 'Profile Photo',
    SELFIE: 'Selfie',
    VEHICLE_PHOTO: 'Vehicle Photo',
  }
  return labels[type]
}

function toDocuments(docs: BackendDriverDocument[], driverId: string): DriverDocument[] {
  return docs.map(doc => ({
    id: doc.id,
    driver_id: driverId,
    doc_type: doc.type,
    file_url: documentProxyUrl(doc.id),
    is_verified: doc.verificationStatus === 'VERIFIED',
    verified_by: null,
    verified_at: doc.verificationStatus === 'VERIFIED' ? doc.uploadedAt : null,
    uploaded_at: doc.uploadedAt,
    mime_type: doc.mimeType,
    rejection_reason: doc.rejectionReason,
    verification_status: doc.verificationStatus.toLowerCase() as DriverDocument['verification_status'],
    label: documentLabel(doc.type),
  }))
}

function documentProxyUrl(documentId: string): string {
  return `/api/driver-documents/${documentId}`
}

function toVehicle(
  v: BackendDriverProfile['vehicle'],
  docs: BackendDriverDocument[],
  driverId: string,
): Vehicle | undefined {
  if (!v) return undefined
  const vehiclePhotos = documentUrls(docs, 'VEHICLE_PHOTO')
  return {
    id: v.id,
    driver_id: driverId,
    vehicle_type: inferVehicleType(v.model),
    make: '',
    model: v.model ?? '',
    year: null,
    color: v.color,
    engine_cc: null,
    license_plate: v.plateNumber ?? '',
    owner_name: v.ownerName,
    owner_phone: null,
    owner_email: null,
    is_verified: docs.some(doc => doc.verificationStatus === 'VERIFIED'),
    image_url: vehiclePhotos[0] ?? null,
    photos: vehiclePhotos.slice(1),
    created_at: v.createdAt,
  }
}

function inferVehicleType(model: string | null | undefined): Vehicle['vehicle_type'] {
  const value = (model ?? '').toLowerCase()
  if (value.includes('bajaj')) return 'bajaj'
  if (value.includes('bod') || value.includes('motor') || value.includes('bike')) return 'bodaboda'
  return 'car'
}

export function toDriver(p: BackendDriverProfile): Driver {
  const vehicle = toVehicle(p.vehicle, p.documents ?? [], p.id)
  const documents = toDocuments(p.documents ?? [], p.id)
  const profilePhoto = documentUrls(p.documents ?? [], 'PROFILE_PHOTO')[0]
    ?? documentUrls(p.documents ?? [], 'SELFIE')[0]
    ?? null
  return {
    id: p.id,
    driver_number: `DRV-${p.id.slice(0, 6).toUpperCase()}`,
    full_name: buildFullName(p),
    email: null,
    phone: p.phone,
    date_of_birth: p.dateOfBirth ?? null,
    national_id: p.nationalIdNumber ?? null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    status: STATUS_MAP[p.status] ?? 'pending',
    zone_id: null,
    rating: 0,
    total_trips: 0,
    completed_trips: 0,
    cancelled_trips: 0,
    complaints_count: 0,
    churn_reason: null,
    suspended_reason: null,
    suspended_at: null,
    suspended_by: null,
    banned_reason: null,
    banned_at: null,
    banned_by: null,
    approved_at: null,
    approved_by: null,
    last_active_at: p.isOnline ? p.updatedAt : null,
    joined_at: p.createdAt,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    avatar_url: profilePhoto,
    address: null,
    zones: null,
    vehicles: vehicle ? [vehicle] : [],
    driver_subscriptions: [],
    documents,
    identity_verification: p.identityVerification ? {
      status: p.identityVerification.status,
      verified_at: p.identityVerification.verifiedAt,
      face_match_score: p.identityVerification.faceMatchScore,
      liveness_score: p.identityVerification.livenessScore,
      id_ocr_passed: p.identityVerification.idOcrPassed,
    } : null,
  }
}
