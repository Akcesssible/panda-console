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

      {/* ── Gradient header ── */}
      <div className="relative bg-gradient-to-br from-[#b8c3f5] via-[#c7d0f8] to-[#dde3ff] h-32 overflow-hidden">

        {/* Panda watermark */}
        <Image
          src="/panda_watermark.svg"
          alt=""
          width={180}
          height={80}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none select-none"
        />

        {/* Verified badge — top right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 shadow-sm">
          <HugeiconsIcon icon={CheckmarkCircleIcon} size={14} color="#2B39C7" strokeWidth={2} />
          <span className="text-xs font-semibold text-[#2B39C7]">Verified</span>
        </div>

        {/* Avatar — square rounded, bottom-left, overlapping */}
        <div className="absolute -bottom-10 left-4">
          {driver.avatar_url ? (
            <Image
              src={driver.avatar_url}
              alt={driver.full_name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-[#2B39C7] border-2 border-white shadow-md flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {driver.full_name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pt-14 px-4 pb-6">

        {/* Name + rating + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-[#1d242d] tracking-[-0.5px]">{driver.full_name}</h2>
          <div className="flex items-center gap-1 bg-[#1d242d] rounded-full px-2.5 py-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-white text-xs font-semibold">{driver.rating?.toFixed(1) ?? '—'}</span>
          </div>
          <DriverStatusBadge status={driver.status} />
        </div>

        {/* Meta chips — 2 rows */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Chip icon={IdCardLanyardIcon} label={driver.driver_number} />
          {zone && <Chip icon={PinLocationIcon} label={zone.city} />}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Chip icon={SmartPhoneIcon} label={driver.phone} />
          <Chip icon={CalendarIcon} label={`Joined ${formatDate(driver.joined_at)}`} />
        </div>

        {/* Last active */}
        <div className="flex items-center gap-2 mt-4">
          <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
          <span className="text-sm font-semibold text-[#1d242d]">
            {driver.last_active_at ? `Active ${timeAgo(driver.last_active_at)}` : 'Offline'}
          </span>
        </div>

        <div className="border-t border-gray-100 my-5" />

        {/* Personal Info */}
        <Section title="Personal Info">
          <TwoCol
            left={<Field label="Email Address" value={driver.email ?? '—'} />}
            right={<Field label="Date of Birth" value={driver.date_of_birth ? formatDate(driver.date_of_birth) : '—'} />}
          />
          <Field label="National ID Number" value={driver.national_id ?? '—'} />
        </Section>

        <div className="border-t border-gray-100 my-5" />

        {/* Emergency Contact */}
        <Section title="Emergency Contact">
          <TwoCol
            left={<Field label="Full Name" value={driver.emergency_contact_name ?? '—'} />}
            right={<Field label="Phone Number" value={driver.emergency_contact_phone ?? '—'} />}
          />
        </Section>

        {vehicle && (
          <>
            <div className="border-t border-gray-100 my-5" />
            <Section title="Vehicle Details">
              <TwoCol
                left={<Field label="Vehicle Type" value={vehicle.vehicle_type} capitalize />}
                right={<Field label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} />}
              />
              <TwoCol
                left={<Field label="Model Year" value={vehicle.year ? String(vehicle.year) : '—'} />}
                right={<Field label="Color" value={vehicle.color ?? '—'} capitalize />}
              />
              <TwoCol
                left={<Field label="Engine CC" value={vehicle.engine_cc ? `${vehicle.engine_cc} CC` : '—'} />}
                right={<Field label="License Plate Number" value={vehicle.license_plate} />}
              />
              <TwoCol
                left={<Field label="Vehicle Owner Name" value={vehicle.owner_name ?? '—'} />}
                right={<Field label="Vehicle Owner Email" value={vehicle.owner_email ?? '—'} />}
              />
              <Field label="Vehicle Owner Phone" value={vehicle.owner_phone ?? '—'} />
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ icon, label }: { icon: React.ComponentType | object; label: string }) {
  return (
    <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <HugeiconsIcon icon={icon as any} size={13} color="#6b7280" strokeWidth={1.5} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-base font-semibold text-[#2B39C7]">{title}</p>
      {children}
    </div>
  )
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {left}
      {right}
    </div>
  )
}

function Field({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <p className={`text-sm font-semibold text-[#1d242d] ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      <p className="text-xs text-[#2B39C7] mt-0.5">{label}</p>
    </div>
  )
}
