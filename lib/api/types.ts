// Hand-written backend DTOs (the backend exposes no OpenAPI spec, so these are
// maintained by hand). Only the fields the backoffice consumes are modelled.
// These are the BACKEND shapes; lib/api/adapters/* maps them to the UI types in
// lib/types/index.ts. Do not import these into UI components directly.

// ── Response envelope (com.pesa.common.api) ─────────────────────────────────
export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
  timestamp: string
}

export interface ApiErrorBody {
  error: string
  message: string
  timestamp: string
}

// ── Auth (auth-service) ─────────────────────────────────────────────────────
export type BackendAdminRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERATIONS_STAFF'
  | 'CUSTOMER_SUPPORT'
  | 'FINANCE_OFFICER'

// data payload of POST /api/v1/auth/admin/login (AuthResponse.java)
export interface AuthResponse {
  token: string
  tokenType: 'Bearer'
  expiresIn: number // seconds
  userId: string
  role: BackendAdminRole
}

// Claims embedded in the issued JWT (JwtServiceImpl).
export interface AdminJwtClaims {
  sub: string // userId
  role: BackendAdminRole
  sub_name: string // email or phone
  mcp: boolean // must-change-password
  iat: number
  exp: number
  jti: string
}

// ── Subscription plans (subscription-service, PlanResponse) ─────────────────
// Note: the backend plan model differs from the UI's. It has monthlyFee +
// tripQuota and no duration/vehicle-type segmentation. The adapter
// (adapters/plans.ts) bridges the two with documented defaults.
export interface PlanResponse {
  id: string
  name: string
  monthlyFee: number // BigDecimal serialized as a JSON number
  tripQuota: number // -1 = unlimited
  description: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePlanBody {
  name: string
  monthlyFee: number
  tripQuota: number // -1 for unlimited
  description?: string
}

// ── Drivers (driver-service, DriverProfileResponse) ────────────────────────
export interface BackendVehicleInfo {
  id: string
  model: string
  ownerName: string | null
  color: string | null
  ownershipStatus: string | null
  plateNumber: string
  createdAt: string
}

export interface BackendDriverDocument {
  id: string
  type:
    | 'NATIONAL_ID'
    | 'DRIVING_LICENSE'
    | 'VEHICLE_REGISTRATION'
    | 'VEHICLE_INSURANCE'
    | 'PROFILE_PHOTO'
    | 'SELFIE'
    | 'VEHICLE_PHOTO'
  fileUrl: string
  mimeType: string | null
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  rejectionReason: string | null
  uploadedAt: string
}

export interface BackendVerificationStatus {
  id: string
  idOcrPassed: boolean
  faceMatchScore: number | null
  livenessScore: number | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PASSED' | 'FAILED'
  verifiedAt: string | null
  createdAt: string
}

export interface BackendDriverProfile {
  id: string
  phone: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  gender: string | null
  dateOfBirth: string | null
  nationalIdNumber: string | null
  drivingLicenseNumber: string | null
  status: 'ONBOARDING' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'
  onboardingStep: number
  isOnline: boolean
  createdAt: string
  updatedAt: string
  vehicle: BackendVehicleInfo | null
  documents: BackendDriverDocument[]
  identityVerification: BackendVerificationStatus | null
}

export interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface BackendDriverTripStats {
  completed: number
  cancelled: number
  todayCompleted: number
  weekCompleted: number
}

// ── Admin users (auth-service, AdminUserResponse) ───────────────────────────
export interface BackendAdminUser {
  id: string
  fullName: string
  email: string
  role: BackendAdminRole
  status: 'ACTIVE' | 'INACTIVE'
  mustChangePassword: boolean
  mfaEnabled: boolean
  lastLoginAt: string | null
  createdAt: string
}

// ── Trips (trip-service, TripResponse) ─────────────────────────────────────
export interface BackendTrip {
  id: string
  riderId: string | null
  driverId: string | null
  pickupLat: number | null
  pickupLng: number | null
  pickupAddress: string
  destinationLat: number | null
  destinationLng: number | null
  destinationAddress: string
  fareEstimate: number | null
  fareActual: number | null
  distanceKm: number | null
  durationMinutes: number | null
  vehicleType: string
  status: string
  paymentStatus: string | null
  paymentReference: string | null
  cancelledBy: string | null
  cancellationReason: string | null
  riderRating: number | null
  rated: boolean
  ratedAt: string | null
  requestedAt: string
  matchedAt: string | null
  acceptedAt: string | null
  startedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  updatedAt: string
}

export interface UpdatePlanBody {
  name?: string
  monthlyFee?: number
  tripQuota?: number
  description?: string | null
  active?: boolean
}
