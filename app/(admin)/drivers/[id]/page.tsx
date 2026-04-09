import { getDriverById } from '@/lib/queries/drivers'
import { getAdminUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { DriverDetailHeader } from '@/components/drivers/DriverDetailHeader'
import { DriverProfileCard } from '@/components/drivers/DriverProfileCard'
import { DriverSubscriptionCard } from '@/components/drivers/DriverSubscriptionCard'
import { DriverVehicleGallery } from '@/components/drivers/DriverVehicleGallery'
import { DriverRideHistory } from '@/components/drivers/DriverRideHistory'
import { StatsRow } from '@/components/ui/StatsRow'
import { formatTZS } from '@/lib/utils'
import type { Driver } from '@/lib/types'
import type { StatItem } from '@/components/ui/StatsRow'

// ── Mock data (shown when DB has no driver or returns error) ─────────────────
const MOCK_DRIVER: Driver = {
  id: 'mock-001',
  driver_number: 'DRV-009812',
  full_name: 'John Mawella',
  email: 'john.mbwile@gmail.com',
  phone: '+255 764 170 434',
  date_of_birth: '1991-12-12',
  national_id: '19911212-13405-00000-12',
  emergency_contact_name: 'Peter Mbwile',
  emergency_contact_phone: '+255 713 882 901',
  address: 'Mikocheni, Dar es Salaam',
  avatar_url: '/driver_mock/Profile.png',
  status: 'active',
  zone_id: null,
  rating: 4.8,
  total_trips: 1284,
  completed_trips: 1210,
  cancelled_trips: 74,
  complaints_count: 2,
  churn_reason: null,
  suspended_reason: null,
  suspended_at: null,
  suspended_by: null,
  approved_at: '2026-01-10T08:00:00Z',
  approved_by: null,
  last_active_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  joined_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
  zones: { id: 'z1', name: 'Dar es Salaam', city: 'Dar es Salaam', is_active: true, boundary: null, created_at: '' },
  vehicles: [
    {
      id: 'v1',
      driver_id: 'mock-001',
      vehicle_type: 'car',
      make: 'Mazda',
      model: 'Verissa',
      year: 2018,
      color: 'Silver',
      engine_cc: 1240,
      license_plate: 'T 554 ENB',
      owner_name: 'John Mbwile',
      owner_phone: '+255 764 170 436',
      owner_email: 'john.mbwile@gmail.com',
      is_verified: true,
      image_url: '/driver_mock/image_0.png',
      photos: [
        '/driver_mock/image_01.png',
        '/driver_mock/image_02.png',
        '/driver_mock/image_03.png',
        '/driver_mock/image_04.png',
        '/driver_mock/image_05.png',
        '/driver_mock/image_06.png',
        '/driver_mock/image_07.png',
      ],
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  driver_subscriptions: [
    {
      id: 'sub1',
      driver_id: 'mock-001',
      plan_id: 'plan1',
      status: 'active',
      started_at: '2026-03-01T00:00:00Z',
      expires_at: '2026-04-01T00:00:00Z',
      grace_ends_at: null,
      rides_remaining: 20,
      assigned_by: null,
      revoked_by: null,
      revoked_at: null,
      revoke_reason: null,
      created_at: '2026-03-01T00:00:00Z',
      subscription_plans: {
        id: 'plan1',
        name: 'Monthly Plan',
        duration_days: 30,
        price_tzs: 4000,
        vehicle_types: ['car'],
        description: null,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    } as never,
  ],
}

const MOCK_RIDES = [
  { id:'r1', ride_number:'R-10529', pickup_address:'Kariakoo', destination_address:'Mbezi',        status:'completed', total_fare_tzs:12000, commission_tzs:1200, driver_earnings_tzs:10800, requested_at: new Date(Date.now()-3*3600000).toISOString(),  completed_at: new Date(Date.now()-2*3600000).toISOString(),  accepted_at: null },
  { id:'r2', ride_number:'R-10511', pickup_address:'Posta',    destination_address:'Kinondoni',    status:'completed', total_fare_tzs:9000,  commission_tzs:900,  driver_earnings_tzs:8100,  requested_at: new Date(Date.now()-5*3600000).toISOString(),  completed_at: new Date(Date.now()-4*3600000).toISOString(),  accepted_at: null },
  { id:'r3', ride_number:'R-10496', pickup_address:'Ubungo',   destination_address:'Mwenge',       status:'completed', total_fare_tzs:11000, commission_tzs:1100, driver_earnings_tzs:9900,  requested_at: new Date(Date.now()-7*3600000).toISOString(),  completed_at: new Date(Date.now()-6*3600000).toISOString(),  accepted_at: null },
  { id:'r4', ride_number:'R-10482', pickup_address:'Sinza',    destination_address:'City Center',  status:'completed', total_fare_tzs:8000,  commission_tzs:800,  driver_earnings_tzs:7200,  requested_at: new Date(Date.now()-9*3600000).toISOString(),  completed_at: new Date(Date.now()-8*3600000).toISOString(),  accepted_at: null },
  { id:'r5', ride_number:'R-10470', pickup_address:'Tegeta',   destination_address:'Mlimani',      status:'cancelled', total_fare_tzs:null,  commission_tzs:null, driver_earnings_tzs:null,  requested_at: new Date(Date.now()-11*3600000).toISOString(), completed_at: null,                                          accepted_at: null },
  { id:'r6', ride_number:'R-10455', pickup_address:'Gongo la Mboto', destination_address:'Kariakoo', status:'cancelled', total_fare_tzs:null, commission_tzs:null, driver_earnings_tzs:null, requested_at: new Date(Date.now()-13*3600000).toISOString(), completed_at: null,                                          accepted_at: null },
  { id:'r7', ride_number:'R-10441', pickup_address:'Msasani',  destination_address:'Ilala',        status:'completed', total_fare_tzs:15000, commission_tzs:1500, driver_earnings_tzs:13500, requested_at: new Date(Date.now()-15*3600000).toISOString(), completed_at: new Date(Date.now()-14*3600000).toISOString(), accepted_at: null },
  { id:'r8', ride_number:'R-10430', pickup_address:'Tabata',   destination_address:'Buguruni',     status:'completed', total_fare_tzs:7000,  commission_tzs:700,  driver_earnings_tzs:6300,  requested_at: new Date(Date.now()-17*3600000).toISOString(), completed_at: new Date(Date.now()-16*3600000).toISOString(), accepted_at: null },
]

const MOCK_LAST_PAYMENT = {
  amount_tzs: 4000,
  paid_at: '2026-03-27T09:20:00Z',
  status: 'completed',
}
// ─────────────────────────────────────────────────────────────────────────────

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [adminUser, result] = await Promise.all([
    getAdminUser(),
    getDriverById(id).catch(() => null),
  ])

  const useMock = !result || result.driver.total_trips === 0
  const driver      = useMock ? MOCK_DRIVER      : result!.driver
  const rides       = useMock ? MOCK_RIDES       : result!.rides
  const todayTrips  = useMock ? 14               : result!.todayTrips
  const lastPayment = useMock ? MOCK_LAST_PAYMENT : result!.lastPayment

  const completionRate = driver.total_trips > 0
    ? Math.round((driver.completed_trips / driver.total_trips) * 100)
    : 0
  const avgEarnings = driver.total_trips > 0
    ? (driver.total_trips * 4200) / Math.max(1, driver.total_trips / 10)
    : 0

  const stats: StatItem[] = [
    {
      label: 'Trips Today',
      value: todayTrips,
      subBadge: 'Active 5 minutes ago',
    },
    {
      label: 'Total Trips',
      value: driver.total_trips.toLocaleString(),
      subBadge: `${driver.completed_trips.toLocaleString()} Completed Trips`,
      subText: `${driver.cancelled_trips} Canceled`,
    },
    {
      label: 'Avg Earnings / Day',
      value: formatTZS(avgEarnings),
      subBadge: `${completionRate}% Completion Rate`,
    },
  ]

  return (
    <div className="w-full flex flex-col gap-4">
      <DriverDetailHeader driver={driver} adminUser={adminUser} />

      <div className="flex gap-4 items-start">
        {/* Left — profile card */}
        <div className="w-[342px] shrink-0">
          <DriverProfileCard driver={driver} />
        </div>

        {/* Right — stats + subscription + vehicle + rides */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <StatsRow stats={stats} />

          <div className="grid grid-cols-3 gap-4">
            <DriverSubscriptionCard driver={driver} lastPayment={lastPayment} />
            <div className="col-span-2">
              <DriverVehicleGallery driver={driver} />
            </div>
          </div>

          <DriverRideHistory rides={rides} />
        </div>
      </div>
    </div>
  )
}
