import Image from 'next/image'
import type { Driver, Vehicle } from '@/lib/types'

export function DriverVehicleGallery({ driver }: { driver: Driver }) {
  const vehicle = (driver.vehicles as Vehicle[] | undefined)?.[0]
  const mainImage = vehicle?.image_url ?? null
  const extraPhotos: string[] = (vehicle?.photos ?? []).filter(Boolean)

  // Combine main + extras for the gallery grid
  const allPhotos = [
    ...(mainImage ? [mainImage] : []),
    ...extraPhotos,
  ]

  if (!vehicle) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-center h-full min-h-[220px]">
        <p className="text-sm text-gray-400">No vehicle registered</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full">
      {allPhotos.length === 0 ? (
        /* No photos placeholder */
        <div className="flex items-center justify-center h-full min-h-[220px] bg-gray-50">
          <p className="text-sm text-gray-400">No vehicle photos</p>
        </div>
      ) : (
        <div className="grid h-full" style={{ gridTemplateColumns: allPhotos.length > 1 ? '1fr 1fr' : '1fr' }}>
          {/* Main / large photo */}
          <div className="relative row-span-2 min-h-[220px]">
            <Image
              src={allPhotos[0]}
              alt="Vehicle main"
              fill
              className="object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
              Vehicle Image · {vehicle.license_plate}
            </div>
          </div>

          {/* Thumbnail grid — up to 4 thumbnails on the right */}
          {allPhotos.length > 1 && (
            <div className="grid grid-cols-2 grid-rows-2">
              {allPhotos.slice(1, 5).map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <Image src={src} alt={`Vehicle ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
              {/* Fill empty cells so grid stays square */}
              {Array.from({ length: Math.max(0, 4 - (allPhotos.length - 1)) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-100" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
