import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircleIcon, IdCardLanyardIcon, SmartPhoneIcon, CalendarIcon, PinLocationIcon } from '@hugeicons/core-free-icons'
import { DriverStatusBadge } from '@/components/ui/Badge'
import { formatDate, timeAgo } from '@/lib/utils'
import type { Driver, Vehicle } from '@/lib/types'

export function DriverProfileCard({ driver }: { driver: Driver }) {
  const vehicle = (driver.vehicles as Vehicle[] | undefined)?.[0]
  const zone = (driver.zones as { name: string; city: string } | null)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Blue gradient header with avatar */}
      <div className="relative bg-gradient-to-br from-[#c7d0f8] to-[#e8ebff] h-28 flex items-end justify-end px-4 pb-3">
        {/* Verified badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5">
          <HugeiconsIcon icon={CheckmarkCircleIcon} size={13} color="#2B39C7" strokeWidth={2} />
          <span className="text-[11px] font-medium text-[#2B39C7]">Verified</span>
        </div>

        {/* Avatar — overlaps border */}
        <div className="absolute -bottom-8 left-4">
          {driver.avatar_url ? (
            <Image
              src={driver.avatar_url}
              alt={driver.full_name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#2B39C7] border-2 border-white shadow-sm flex items-center justify-center">
              <span className="text-white text-xl font-semibold">
                {driver.full_name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name + status + rating */}
      <div className="pt-10 px-4 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-[#1d242d]">{driver.full_name}</h2>
          <div className="flex items-center gap-1 bg-[#1d242d] rounded-full px-2 py-0.5">
            <span className="text-yellow-400 text-[11px]">★</span>
            <span className="text-white text-[11px] font-medium">{driver.rating?.toFixed(1) ?? '—'}</span>
          </div>
          <DriverStatusBadge status={driver.status} />
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Chip icon={IdCardLanyardIcon} label={driver.driver_number} />
          {zone && <Chip icon={PinLocationIcon} label={zone.city} />}
        </div>

        <div className="flex flex-wrap gap-2 mt-1.5">
          <Chip icon={SmartPhoneIcon} label={driver.phone} />
          <Chip icon={CalendarIcon} label={`Joined ${formatDate(driver.joined_at)}`} />
        </div>

        {/* Last active */}
        <p className="text-xs text-green-500 mt-3 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          {driver.last_active_at ? `Active ${timeAgo(driver.last_active_at)}` : 'Offline'}
        </p>

        <div className="border-t border-gray-100 my-4" />

        {/* Personal info */}
        <Section title="Personal Info">
          <Row label="Email Address" value={driver.email ?? '—'} />
          <Row label="Date of Birth" value={driver.date_of_birth ? formatDate(driver.date_of_birth) : '—'} />
          <Row label="Address" value={driver.address ?? '—'} />
          <Row label="National ID Number" value={driver.national_id ?? '—'} />
        </Section>

        <div className="border-t border-gray-100 my-4" />

        {/* Emergency contact */}
        <Section title="Emergency Contact">
          <Row label="Full Name" value={driver.emergency_contact_name ?? '—'} />
          <Row label="Phone Number" value={driver.emergency_contact_phone ?? '—'} />
        </Section>

        {vehicle && (
          <>
            <div className="border-t border-gray-100 my-4" />
            <Section title="Vehicle Details">
              <Row label="Vehicle Type" value={vehicle.vehicle_type} />
              <Row label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} />
              <Row label="Model Year" value={vehicle.year ? String(vehicle.year) : '—'} />
              <Row label="Color" value={vehicle.color ?? '—'} />
              <Row label="Engine CC" value={vehicle.engine_cc ? `${vehicle.engine_cc} CC` : '—'} />
              <Row label="License Plate Number" value={vehicle.license_plate} />
              <Row label="Vehicle Owner Name" value={vehicle.owner_name ?? '—'} />
              <Row label="Vehicle Owner Email" value={vehicle.owner_email ?? '—'} />
              <Row label="Vehicle Owner Phone" value={vehicle.owner_phone ?? '—'} />
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function Chip({ icon, label }: { icon: React.ComponentType | object; label: string }) {
  return (
    <div className="flex items-center gap-1 border border-gray-200 rounded-full px-2.5 py-0.5">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <HugeiconsIcon icon={icon as any} size={12} color="#6b7280" strokeWidth={1.5} />
      <span className="text-[11px] text-gray-500">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#2B39C7] mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xs text-[#1d242d] font-medium">{value}</p>
    </div>
  )
}
