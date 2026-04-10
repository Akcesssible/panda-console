// Shared avatar component — gradient PNG images assigned stably per user/driver ID.
// 9 images at /public/avatars/avatar_01.png … avatar_09.png.
// The same ID always resolves to the same avatar (deterministic hash).

import Image from 'next/image'

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COUNT = 9

/**
 * Explicit overrides — pin a specific person to a specific avatar regardless
 * of what their UUID would hash to. Key = full name exactly as stored in DB.
 */
const AVATAR_OVERRIDES: Record<string, number> = {
  'Kevin Msemakweli': 5,
}

/** Stable 1-based index (1–9). Checks name overrides first, then hashes ID. */
function resolveIndex(id: string, name: string): number {
  if (AVATAR_OVERRIDES[name] !== undefined) return AVATAR_OVERRIDES[name]
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return (hash % AVATAR_COUNT) + 1
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// ── Still exported so TopBar / anywhere else that needs initials can use them ─
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ── Component ─────────────────────────────────────────────────────────────────
interface AvatarProps {
  id: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
}

const SIZE_PX = { sm: 28, md: 36, lg: 40 }

export function Avatar({ id, name, size = 'md' }: AvatarProps) {
  const src = `/avatars/avatar_${pad(resolveIndex(id, name))}.png`
  const px  = SIZE_PX[size]
  return (
    <div className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden shrink-0`}>
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
