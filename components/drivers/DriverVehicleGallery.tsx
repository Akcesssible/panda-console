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

  if (!vehicle) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center min-h-[260px]">
        <p className="text-sm text-gray-400">No vehicle registered</p>
      </div>
    )
  }

  if (allPhotos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center min-h-[260px]">
        <p className="text-sm text-gray-400">No vehicle photos</p>
      </div>
    )
  }

  function prev() {
    setActiveIndex(i => (i - 1 + allPhotos.length) % allPhotos.length)
  }
  function next() {
    setActiveIndex(i => (i + 1) % allPhotos.length)
  }

  return (
    <div className="flex gap-2 h-full min-h-[260px]">

      {/* ── Left: main viewer ── */}
      <div className="relative flex-1 rounded-2xl overflow-hidden bg-gray-100 group">
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
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="white" strokeWidth={2} />
          </button>
        )}

        {/* Next arrow */}
        {allPhotos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="white" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Right: thumbnail strip ── */}
      <div className="w-28 flex flex-col gap-1.5 overflow-y-auto">
        {allPhotos.map((src, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`relative w-full aspect-square rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-150 ${
              i === activeIndex
                ? 'border-[#2B39C7] shadow-md'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image src={src} alt={`Vehicle ${i + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>

    </div>
  )
}
