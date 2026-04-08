import type { Driver, Vehicle } from '@/lib/types'

export function DriverVehicleInfo({ driver }: { driver: Driver }) {
  const vehicle = (driver.vehicles as Vehicle[] | undefined)?.[0]

  if (!vehicle) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Vehicle Details</h2>
        <p className="text-sm text-gray-400">No vehicle registered</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Vehicle Details</h2>
        {vehicle.is_verified && (
          <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            Verified
          </span>
        )}
      </div>

      {vehicle.image_url && (
        <img
          src={vehicle.image_url}
          alt="Vehicle"
          className="w-full h-36 object-cover rounded-lg mb-4 bg-gray-100"
        />
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <InfoRow label="Vehicle Type" value={vehicle.vehicle_type} />
        <InfoRow label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} />
        <InfoRow label="Year" value={vehicle.year ? String(vehicle.year) : '—'} />
        <InfoRow label="Color" value={vehicle.color ?? '—'} />
        <InfoRow label="Engine CC" value={vehicle.engine_cc ? `${vehicle.engine_cc} CC` : '—'} />
        <InfoRow label="License Plate" value={vehicle.license_plate} />
        <InfoRow label="Owner Name" value={vehicle.owner_name ?? '—'} />
        <InfoRow label="Owner Phone" value={vehicle.owner_phone ?? '—'} />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 capitalize">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5 capitalize">{value}</p>
    </div>
  )
}
