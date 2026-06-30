import { api } from '@/lib/api/client'
import { paths } from '@/lib/api/paths'
import { toDriver } from '@/lib/api/adapters'
import { platformQuery } from '@/lib/platform-db'
import type {
  BackendDriverProfile,
  BackendDriverTripStats,
  BackendPage,
  BackendTrip,
} from '@/lib/api/types'
import type {
  Driver,
  DriverDocument,
  DriverStatus,
  DriverSubscription,
  Ride,
  RideStatus,
  SubscriptionPayment,
  SubscriptionPlan,
  Vehicle,
  Zone,
} from '@/lib/types'

const PER_PAGE = 20
const DETAIL_RIDES_PAGE_SIZE = 100
const ALL_DRIVERS_FETCH_SIZE = 200
const INACTIVE_AFTER_DAYS = 30
const API_BASE_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8000'

type PlatformDriverAuthRow = {
  id: string
  phone: string | null
  status: string | null
  onboarding_step: number | null
  created_at: string | null
  updated_at: string | null
  last_login_at: string | null
}

type PlatformDriverProfileRow = {
  id: string
  phone: string | null
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  gender: string | null
  date_of_birth: string | null
  national_id_number: string | null
  driving_license_number: string | null
  status: string | null
  onboarding_step: number | null
  is_online: boolean | null
  created_at: string | null
  updated_at: string | null
}

type PlatformEmergencyContactRow = {
  driver_id: string
  full_name: string | null
  phone: string | null
}

type PlatformVehicleRow = {
  id: string
  driver_id: string
  model: string | null
  owner_name: string | null
  color: string | null
  ownership_status: string | null
  plate_number: string | null
  created_at: string | null
  updated_at: string | null
}

type PlatformDocumentRow = {
  id: string
  driver_id: string
  type: string
  file_url: string
  mime_type: string | null
  verification_status: string | null
  rejection_reason: string | null
  uploaded_at: string | null
}

type PlatformIdentityRow = {
  driver_id: string
  status: string | null
  verified_at: string | null
  face_match_score: string | null
  liveness_score: string | null
  id_ocr_passed: boolean | null
}

type PlatformSubscriptionRow = {
  id: string
  driver_id: string
  plan_id: string
  status: string | null
  trips_used: number | null
  current_period_start: string | null
  current_period_end: string | null
  auto_renew: boolean | null
  created_at: string | null
  updated_at: string | null
  last_payment_event_id: string | null
  plan_name: string | null
  plan_monthly_fee: string | null
  plan_trip_quota: number | null
  plan_description: string | null
  plan_active: boolean | null
  plan_created_at: string | null
  plan_updated_at: string | null
}

type PlatformPaymentRow = {
  driver_id: string
  amount_tzs: string | number | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getDrivers(params: {
  status?: DriverStatus | DriverStatus[]
  page?: number
  search?: string
}) {
  const { status, page = 1, search } = params
  return getAllDrivers({ page, search, status })
}

async function getAllDrivers(params: {
  page: number
  search?: string
  status?: DriverStatus | DriverStatus[]
}) {
  const { page, search, status } = params
  const [pending, onboarding, active, suspended, rejected] = await Promise.all([
    api.get<BackendDriverProfile[]>(paths.driversPending).catch(() => []),
    fetchDriversByBackendStatus('ONBOARDING'),
    fetchDriversByBackendStatus('ACTIVE'),
    fetchDriversByBackendStatus('SUSPENDED'),
    fetchDriversByBackendStatus('REJECTED'),
  ])

  const combined = [
    ...(pending ?? []),
    ...onboarding,
    ...active,
    ...suspended,
    ...rejected,
  ]

  const deduped = Array.from(
    new Map(combined.map(driver => [driver.id, driver])).values(),
  )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  const merged = deduped.length > 0
    ? await overlayLocalDrivers(deduped.map(toDriver))
    : await fetchLocalDriversPage()
  const statuses = Array.isArray(status) ? status : status ? [status] : []
  const filtered = merged
    .filter(driver => {
      if (statuses.length > 0 && !statuses.includes(driver.status)) return false
      if (!search) return true
      const q = search.toLowerCase()
      return [
        driver.driver_number,
        driver.full_name,
        driver.phone,
        driver.email,
        driver.national_id,
        driver.address,
        driver.vehicles?.[0]?.license_plate,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(q))
    })

  const start = (page - 1) * PER_PAGE
  const pageSlice = filtered.slice(start, start + PER_PAGE)

  return {
    drivers: pageSlice,
    total: filtered.length,
  }
}

async function fetchDriversByBackendStatus(status: string) {
  const qs = new URLSearchParams()
  qs.set('page', '0')
  qs.set('size', String(ALL_DRIVERS_FETCH_SIZE))
  qs.set('status', status)
  const result = await api.get<BackendPage<BackendDriverProfile>>(
    `${paths.drivers}?${qs.toString()}`,
  ).catch(() => null)
  return result?.content ?? []
}

export async function getDriverById(id: string) {
  const [profile, tripsPage, stats, localMap, lastPayments] = await Promise.all([
    api.get<BackendDriverProfile>(paths.driver(id)).catch(() => null),
    api.get<BackendPage<BackendTrip>>(
      `${paths.driverTripsAdmin(id)}?page=0&size=${DETAIL_RIDES_PAGE_SIZE}`,
    ).catch(() => null),
    api.get<BackendDriverTripStats>(paths.driverTripStatsAdmin(id)).catch(() => null),
    fetchLocalDriverMap([id]),
    fetchLatestPayments([id]),
  ])

  const localDriver = localMap.get(id)
  if (!profile && localDriver) {
    const rides = (tripsPage?.content ?? []).map(toRide)
    const driver = finalizeDriver({
      ...localDriver,
      last_active_at: mostRecentActivity([localDriver.last_active_at, ...rides.map(ride => ride.completed_at)]),
    })

    return {
      driver,
      documents: driver.documents ?? [],
      rides,
      todayTrips: stats?.todayCompleted ?? 0,
      weekTrips: stats?.weekCompleted ?? 0,
      lastPayment: lastPayments.get(id) ?? null,
    }
  }

  if (!profile) {
    throw new Error('Driver not found')
  }

  const rides = (tripsPage?.content ?? []).map(toRide)
  const baseDriver = {
    ...toDriver(profile),
    total_trips: (stats?.completed ?? 0) + (stats?.cancelled ?? 0),
    completed_trips: stats?.completed ?? 0,
    cancelled_trips: stats?.cancelled ?? 0,
  } as Driver
  const driver = localDriver ? mergeDriver(baseDriver, localDriver) : finalizeDriver(baseDriver)

  if (!driver.last_active_at) {
    driver.last_active_at = mostRecentActivity([driver.last_active_at, ...rides.map(ride => ride.completed_at)])
    driver.status = deriveStatus(driver)
  }

  return {
    driver,
    documents: driver.documents ?? [],
    rides,
    todayTrips: stats?.todayCompleted ?? 0,
    weekTrips: stats?.weekCompleted ?? 0,
    lastPayment: lastPayments.get(id) ?? null,
  }
}

async function fetchLocalDriversPage() {
  return fetchPlatformDrivers()
}

async function overlayLocalDrivers(drivers: Driver[]) {
  const localMap = await fetchLocalDriverMap(drivers.map(driver => driver.id))
  return drivers.map(driver => {
    const local = localMap.get(driver.id)
    const merged = local ? mergeDriver(driver, local) : finalizeDriver(driver)
    if (!merged.last_active_at) {
      merged.last_active_at = driver.last_active_at
      merged.status = deriveStatus(merged)
    }
    return merged
  })
}

async function fetchLocalDriverMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, Driver>()
  const drivers = await fetchPlatformDrivers(ids)
  return new Map(drivers.map(driver => [driver.id, driver]))
}

async function fetchLatestPayments(ids: string[]) {
  const map = new Map<string, { amount_tzs: number; paid_at: string | null; status: string }>()
  if (ids.length === 0) return map

  const { rows } = await platformQuery<PlatformPaymentRow>(`
    select driver_id, amount_tzs, status, created_at, updated_at
    from payments
    where driver_id = any($1::uuid[])
    order by coalesce(updated_at, created_at) desc
  `, [ids])

  for (const row of rows) {
    if (row.driver_id && !map.has(row.driver_id)) {
      map.set(row.driver_id, {
        amount_tzs: Number(row.amount_tzs ?? 0),
        paid_at: row.updated_at ?? row.created_at ?? null,
        status: normalizePaymentStatus(row.status),
      })
    }
  }

  return map
}

function mergeDriver(base: Driver, overlay: Driver): Driver {
  const merged: Driver = {
    ...base,
    ...overlay,
    status: resolveMergedStatus(base.status, overlay.status),
    driver_number: overlay.driver_number || base.driver_number,
    full_name: overlay.full_name || base.full_name,
    email: overlay.email ?? base.email,
    phone: overlay.phone || base.phone,
    date_of_birth: overlay.date_of_birth ?? base.date_of_birth,
    national_id: overlay.national_id ?? base.national_id,
    emergency_contact_name: overlay.emergency_contact_name ?? base.emergency_contact_name,
    emergency_contact_phone: overlay.emergency_contact_phone ?? base.emergency_contact_phone,
    rating: overlay.rating || base.rating,
    total_trips: Math.max(base.total_trips, overlay.total_trips),
    completed_trips: Math.max(base.completed_trips, overlay.completed_trips),
    cancelled_trips: Math.max(base.cancelled_trips, overlay.cancelled_trips),
    complaints_count: Math.max(base.complaints_count, overlay.complaints_count),
    churn_reason: overlay.churn_reason ?? base.churn_reason,
    suspended_reason: overlay.suspended_reason ?? base.suspended_reason,
    suspended_at: overlay.suspended_at ?? base.suspended_at,
    suspended_by: overlay.suspended_by ?? base.suspended_by,
    banned_reason: overlay.banned_reason ?? base.banned_reason,
    banned_at: overlay.banned_at ?? base.banned_at,
    banned_by: overlay.banned_by ?? base.banned_by,
    approved_at: overlay.approved_at ?? base.approved_at,
    approved_by: overlay.approved_by ?? base.approved_by,
    last_active_at: mostRecentActivity([overlay.last_active_at, base.last_active_at]),
    joined_at: overlay.joined_at || base.joined_at,
    created_at: overlay.created_at || base.created_at,
    updated_at: overlay.updated_at || base.updated_at,
    avatar_url: overlay.avatar_url ?? base.avatar_url,
    address: overlay.address ?? base.address,
    zones: overlay.zones ?? base.zones ?? null,
    vehicles: mergeVehicles(base.vehicles, overlay.vehicles),
    driver_subscriptions: overlay.driver_subscriptions?.length ? overlay.driver_subscriptions : (base.driver_subscriptions ?? []),
    documents: mergeDocuments(base.documents, overlay.documents),
    identity_verification: overlay.identity_verification ?? base.identity_verification ?? null,
  }

  return finalizeDriver(merged)
}

function mergeVehicles(base: Vehicle[] | undefined, overlay: Vehicle[] | undefined) {
  const baseVehicle = base?.[0]
  const localVehicle = overlay?.[0]
  if (!baseVehicle && !localVehicle) return []
  if (!baseVehicle) return overlay ?? []
  if (!localVehicle) return base ?? []

  const photos = Array.from(
    new Set([
      ...(localVehicle.photos ?? []),
      ...(baseVehicle.image_url ? [baseVehicle.image_url] : []),
      ...(baseVehicle.photos ?? []),
      ...(localVehicle.image_url ? [localVehicle.image_url] : []),
    ].filter(Boolean)),
  )

  return [{
    ...baseVehicle,
    ...localVehicle,
    image_url: localVehicle.image_url ?? baseVehicle.image_url,
    photos: photos.filter(photo => photo !== (localVehicle.image_url ?? baseVehicle.image_url)),
    make: localVehicle.make || baseVehicle.make,
    model: localVehicle.model || baseVehicle.model,
    license_plate: localVehicle.license_plate || baseVehicle.license_plate,
  }]
}

function mergeDocuments(base: DriverDocument[] | undefined, overlay: DriverDocument[] | undefined) {
  const docs = [...(overlay ?? []), ...(base ?? [])]
  return Array.from(
    new Map(docs.map(doc => [`${doc.doc_type}:${doc.file_url}`, {
      ...doc,
      label: doc.label ?? prettifyDocType(doc.doc_type),
    }])).values(),
  )
}

async function fetchPlatformDrivers(ids?: string[]) {
  const authRows = await queryPlatformDriverAuth(ids)
  if (authRows.length === 0) return []

  const driverIds = authRows.map(row => row.id)
  const [
    profiles,
    emergencyContacts,
    vehicles,
    documents,
    identityRows,
    subscriptions,
  ] = await Promise.all([
    queryByDriverIds<PlatformDriverProfileRow>('driver_profiles', driverIds),
    queryByDriverIds<PlatformEmergencyContactRow>('emergency_contacts', driverIds),
    queryByDriverIds<PlatformVehicleRow>('vehicles', driverIds),
    queryByDriverIds<PlatformDocumentRow>('driver_documents', driverIds),
    queryByDriverIds<PlatformIdentityRow>('identity_verifications', driverIds),
    queryDriverSubscriptions(driverIds),
  ])

  const profilesById = new Map(profiles.map(row => [row.id, row]))
  const emergencyByDriverId = new Map(emergencyContacts.map(row => [row.driver_id, row]))
  const identityByDriverId = new Map(identityRows.map(row => [row.driver_id, row]))
  const vehiclesByDriverId = groupBy(vehicles, row => row.driver_id)
  const documentsByDriverId = groupBy(documents, row => row.driver_id)
  const subscriptionsByDriverId = groupBy(subscriptions, row => row.driver_id)

  return authRows.map(authRow => {
    const profile = profilesById.get(authRow.id)
    const driverDocs = documentsByDriverId.get(authRow.id) ?? []
    const avatarDoc = driverDocs.find(doc => doc.type === 'PROFILE_PHOTO') ?? driverDocs.find(doc => doc.type === 'SELFIE')
    const vehiclePhotoUrls = driverDocs
      .filter(doc => doc.type === 'VEHICLE_PHOTO')
      .map(doc => toAssetUrl(doc.file_url))
      .filter((value): value is string => Boolean(value))
    const localVehicles = (vehiclesByDriverId.get(authRow.id) ?? []).map(vehicle => toVehicleRecord(vehicle, vehiclePhotoUrls))
    const emergency = emergencyByDriverId.get(authRow.id)
    const identity = identityByDriverId.get(authRow.id)

    return finalizeDriver({
      id: authRow.id,
      driver_number: `DRV-${authRow.id.slice(0, 6).toUpperCase()}`,
      full_name: fullNameFromProfile(profile) ?? authRow.phone ?? authRow.id,
      email: null,
      phone: profile?.phone ?? authRow.phone ?? '',
      date_of_birth: profile?.date_of_birth ?? null,
      national_id: profile?.national_id_number ?? null,
      emergency_contact_name: emergency?.full_name ?? null,
      emergency_contact_phone: emergency?.phone ?? null,
      status: normalizeStatus(profile?.status ?? authRow.status),
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
      last_active_at: profile?.is_online ? (profile.updated_at ?? authRow.last_login_at ?? authRow.updated_at) : (authRow.last_login_at ?? null),
      joined_at: profile?.created_at ?? authRow.created_at ?? new Date(0).toISOString(),
      created_at: authRow.created_at ?? profile?.created_at ?? new Date(0).toISOString(),
      updated_at: profile?.updated_at ?? authRow.updated_at ?? authRow.created_at ?? new Date(0).toISOString(),
      avatar_url: avatarDoc ? toDocumentProxyUrl(avatarDoc.id) : null,
      address: null,
      zones: null,
      vehicles: localVehicles,
      driver_subscriptions: subscriptionsByDriverId.get(authRow.id)?.map(toDriverSubscription) ?? [],
      documents: driverDocs.map(toDriverDocument),
      identity_verification: identity ? {
        status: (identity.status ?? 'PENDING').toLowerCase(),
        verified_at: identity.verified_at,
        face_match_score: identity.face_match_score ? Number(identity.face_match_score) : null,
        liveness_score: identity.liveness_score ? Number(identity.liveness_score) : null,
        id_ocr_passed: Boolean(identity.id_ocr_passed),
      } : null,
    })
  })
}

async function queryPlatformDriverAuth(ids?: string[]) {
  if (ids?.length) {
    const { rows } = await platformQuery<PlatformDriverAuthRow>(`
      select id, phone, status, onboarding_step, created_at, updated_at, last_login_at
      from drivers
      where id = any($1::uuid[])
    `, [ids])
    return rows
  }

  const { rows } = await platformQuery<PlatformDriverAuthRow>(`
    select id, phone, status, onboarding_step, created_at, updated_at, last_login_at
    from drivers
    order by created_at desc
  `)
  return rows
}

async function queryByDriverIds<T extends { driver_id?: string; id?: string }>(table: string, ids: string[]) {
  if (ids.length === 0) return [] as T[]

  const key = table === 'driver_profiles' ? 'id' : 'driver_id'
  const { rows } = await platformQuery<T>(`
    select *
    from ${table}
    where ${key} = any($1::uuid[])
  `, [ids])
  return rows
}

async function queryDriverSubscriptions(ids: string[]) {
  if (ids.length === 0) return [] as PlatformSubscriptionRow[]

  const { rows } = await platformQuery<PlatformSubscriptionRow>(`
    select
      ds.*,
      sp.name as plan_name,
      sp.monthly_fee as plan_monthly_fee,
      sp.trip_quota as plan_trip_quota,
      sp.description as plan_description,
      sp.active as plan_active,
      sp.created_at as plan_created_at,
      sp.updated_at as plan_updated_at
    from driver_subscriptions ds
    left join subscription_plans sp on sp.id = ds.plan_id
    where ds.driver_id = any($1::uuid[])
    order by ds.updated_at desc nulls last, ds.created_at desc
  `, [ids])

  return rows
}

function toVehicleRecord(row: PlatformVehicleRow, vehiclePhotoUrls: string[]): Vehicle {
  const mainImage = vehiclePhotoUrls[0] ?? null

  return {
    id: row.id,
    driver_id: row.driver_id,
    vehicle_type: inferVehicleType(row.model),
    make: '',
    model: row.model ?? '',
    year: null,
    color: row.color ?? null,
    engine_cc: null,
    license_plate: row.plate_number ?? '—',
    owner_name: row.owner_name ?? null,
    owner_phone: null,
    owner_email: null,
    is_verified: false,
    image_url: mainImage,
    photos: mainImage ? vehiclePhotoUrls.slice(1) : vehiclePhotoUrls,
    created_at: row.created_at ?? row.updated_at ?? new Date(0).toISOString(),
  }
}

function toDriverDocument(row: PlatformDocumentRow): DriverDocument {
  const status = normalizeVerificationStatus(row.verification_status)
  return {
    id: row.id,
    driver_id: row.driver_id,
    doc_type: row.type,
    file_url: toDocumentProxyUrl(row.id),
    is_verified: status === 'verified',
    verified_by: null,
    verified_at: null,
    uploaded_at: row.uploaded_at ?? new Date(0).toISOString(),
    mime_type: row.mime_type,
    rejection_reason: row.rejection_reason,
    verification_status: status,
    label: prettifyDocType(row.type),
  }
}

function toDriverSubscription(row: PlatformSubscriptionRow): DriverSubscription & { subscription_plans?: SubscriptionPlan } {
  const tripQuota = row.plan_trip_quota ?? null
  const ridesRemaining = tripQuota == null
    ? null
    : Math.max(0, tripQuota - Number(row.trips_used ?? 0))

  return {
    id: row.id,
    driver_id: row.driver_id,
    plan_id: row.plan_id,
    status: normalizeSubscriptionStatus(row.status),
    started_at: row.current_period_start ?? row.created_at ?? new Date(0).toISOString(),
    expires_at: row.current_period_end ?? row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
    grace_ends_at: null,
    rides_remaining: ridesRemaining,
    assigned_by: null,
    revoked_by: null,
    revoked_at: null,
    revoke_reason: null,
    created_at: row.created_at ?? new Date(0).toISOString(),
    subscription_plans: row.plan_name ? {
      id: row.plan_id,
      name: row.plan_name,
      duration_days: 30,
      price_tzs: Number(row.plan_monthly_fee ?? 0),
      vehicle_types: ['bodaboda', 'bajaj', 'car'],
      description: row.plan_description,
      is_active: Boolean(row.plan_active),
      created_at: row.plan_created_at ?? row.created_at ?? new Date(0).toISOString(),
      updated_at: row.plan_updated_at ?? row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
    } : undefined,
  }
}

function groupBy<T>(rows: T[], getKey: (row: T) => string) {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const key = getKey(row)
    const bucket = map.get(key)
    if (bucket) bucket.push(row)
    else map.set(key, [row])
  }
  return map
}

function fullNameFromProfile(profile?: PlatformDriverProfileRow) {
  if (!profile) return null
  return [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || null
}

function toAssetUrl(fileUrl: string | null | undefined) {
  if (!fileUrl) return null
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl
  return `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
}

function toDocumentProxyUrl(documentId: string) {
  return `/api/driver-documents/${documentId}`
}

function inferVehicleType(model: string | null | undefined): Vehicle['vehicle_type'] {
  const value = (model ?? '').toLowerCase()
  if (value.includes('bajaj')) return 'bajaj'
  if (value.includes('bod') || value.includes('motor') || value.includes('bike')) return 'bodaboda'
  return 'car'
}

function finalizeDriver(driver: Driver): Driver {
  return {
    ...driver,
    documents: (driver.documents ?? []).map(doc => ({
      ...doc,
      label: doc.label ?? prettifyDocType(doc.doc_type),
    })),
    status: deriveStatus(driver),
  }
}

function deriveStatus(driver: Driver): DriverStatus {
  if (driver.banned_at || driver.banned_reason) return 'banned'
  if (driver.status === 'active' && isOlderThanDays(driver.last_active_at, INACTIVE_AFTER_DAYS)) return 'inactive'
  return driver.status
}

function normalizeStatus(status: string | null): DriverStatus {
  switch (status) {
    case 'active':
    case 'inactive':
    case 'suspended':
    case 'banned':
    case 'churned':
      return status
    default:
      return 'pending'
  }
}

function isOlderThanDays(dateString: string | null | undefined, days: number) {
  if (!dateString) return false
  const ageMs = Date.now() - new Date(dateString).getTime()
  return ageMs >= days * 24 * 60 * 60 * 1000
}

function mostRecentActivity(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null
}

function prettifyDocType(docType: string) {
  return docType
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeVerificationStatus(value: string | null | undefined): DriverDocument['verification_status'] {
  switch ((value ?? '').toUpperCase()) {
    case 'VERIFIED':
      return 'verified'
    case 'REJECTED':
      return 'rejected'
    default:
      return 'pending'
  }
}

function normalizeSubscriptionStatus(value: string | null | undefined): DriverSubscription['status'] {
  switch ((value ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'active'
    case 'EXPIRED':
      return 'expired'
    case 'CANCELLED':
      return 'cancelled'
    case 'GRACE_PERIOD':
      return 'grace_period'
    default:
      return 'active'
  }
}

function normalizePaymentStatus(value: string | null | undefined) {
  switch ((value ?? '').toUpperCase()) {
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    default:
      return 'pending'
  }
}

function resolveMergedStatus(base: DriverStatus, overlay: DriverStatus) {
  if (overlay === 'banned' || overlay === 'suspended' || overlay === 'churned') return overlay
  if (base === 'banned' || base === 'suspended' || base === 'churned') return base
  if ((base === 'active' || base === 'inactive') && overlay === 'pending') return base
  return overlay || base
}

const TRIP_STATUS_MAP: Record<string, RideStatus> = {
  REQUESTED: 'requested',
  MATCHED: 'requested',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

function toRide(t: BackendTrip): Ride {
  return {
    id: t.id,
    ride_number: t.id.slice(0, 8).toUpperCase(),
    driver_id: t.driverId ?? null,
    rider_phone: '',
    rider_name: null,
    vehicle_type: (t.vehicleType?.toLowerCase() ?? 'car') as Ride['vehicle_type'],
    zone_id: null,
    pricing_rule_id: null,
    status: TRIP_STATUS_MAP[t.status] ?? 'cancelled',
    pickup_address: t.pickupAddress,
    pickup_lat: t.pickupLat ?? null,
    pickup_lng: t.pickupLng ?? null,
    destination_address: t.destinationAddress,
    destination_lat: t.destinationLat ?? null,
    destination_lng: t.destinationLng ?? null,
    distance_km: t.distanceKm ?? null,
    duration_minutes: t.durationMinutes ?? null,
    base_fare_tzs: null,
    distance_fare_tzs: null,
    time_fare_tzs: null,
    peak_multiplier: 1,
    total_fare_tzs: t.fareActual ?? t.fareEstimate ?? null,
    commission_rate: 0,
    commission_tzs: 0,
    driver_earnings_tzs: t.fareActual ?? t.fareEstimate ?? null,
    is_subscriber_ride: false,
    cancellation_reason: t.cancellationReason ?? null,
    cancelled_by: t.cancelledBy ?? null,
    is_flagged: false,
    flag_reason: null,
    requested_at: t.requestedAt,
    accepted_at: t.acceptedAt ?? null,
    started_at: t.startedAt ?? null,
    completed_at: t.completedAt ?? null,
    cancelled_at: t.cancelledAt ?? null,
    created_at: t.requestedAt,
    drivers: null,
    zones: null,
  }
}
