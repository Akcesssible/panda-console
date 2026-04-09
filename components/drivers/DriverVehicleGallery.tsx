'use client'

import { useState } from 'react'
import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import type { Driver, Vehicle } from '@/lib/types'

export function DriverVehicleGallery({ driver }: { driver: Driver }) {
  const vehicle = (driver.vehicles as Vehicle[] | undefined)?.[0]
  const mainImage = vehicle?.image_url ?? null
  const extraPhotos: string[] = (vehicle?.photos ?? []).filter(Boolean)
  const allPhotos = [...(mainImage ? [mainImage] : []), ...extraPhotos]

  const [activeIndex, setActiveIndex] = useState(0)

  if (!vehicle || allPhotos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center h-[240px]">
        <p className="text-sm text-gray-400">{!vehicle ? 'No vehicle registered' : 'No vehicle photos'}</p>
      </div>
    )
  }

  function prev() { setActiveIndex(i => (i - 1 + allPhotos.length) % allPhotos.length) }
  function next() { setActiveIndex(i => (i + 1) % allPhotos.length) }

  return (
    <div className="bg-white flex gap-1 h-[240px] rounded-2xl px-2 py-2 overflow-hidden">

      {/* ── Left: main viewer — 55% ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 group" style={{ flex: '0 0 60%' }}>
        <Image
          src={allPhotos[activeIndex]}
          alt="Vehicle"
          fill
          className="object-cover transition-all duration-300"
        />

        {/* Label overlay */}
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md leading-tight">
            <p className="font-medium">Vehicle Image</p>
            <p className="text-white/70">{vehicle.license_plate}</p>
          </div>
        </div>

        {/* Prev arrow */}
        {allPhotos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="white" strokeWidth={2} />
          </button>
        )}

        {/* Next arrow */}
        {allPhotos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="white" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Right: 2-column thumbnail grid — 45% ── */}
      <div className="grid grid-cols-2 gap-1 overflow-hidden" style={{ flex: '0 0 calc(40% - 8px)' }}>
        {allPhotos.map((src, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="relative w-full h-full overflow-hidden rounded-lg"
          >
            <Image src={src} alt={`Vehicle ${i + 1}`} fill className="object-cover rounded-lg" />
            {/* Blue overlay on active */}
            {i === activeIndex && (
              <div className="absolute inset-0 bg-[#2B39C7]/50 rounded-lg" />
            )}
          </button>
        ))}
      </div>

    </div>
  )
}
