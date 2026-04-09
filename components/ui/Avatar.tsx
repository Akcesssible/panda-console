// Shared avatar component — vibrant initials circle, stable colour per ID.
// Used in Settings user list, Drivers table, Commissions table, TopBar, etc.

// ── Palette ───────────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  { bg: '#FDE68A', text: '#92400E' }, // amber
  { bg: '#6EE7B7', text: '#065F46' }, // emerald
  { bg: '#93C5FD', text: '#1E3A8A' }, // blue
  { bg: '#FCA5A5', text: '#7F1D1D' }, // red
  { bg: '#C4B5FD', text: '#4C1D95' }, // violet
  { bg: '#FCD34D', text: '#78350F' }, // yellow
  { bg: '#6EE7F7', text: '#164E63' }, // cyan
  { bg: '#F9A8D4', text: '#831843' }, // pink
  { bg: '#86EFAC', text: '#14532D' }, // green
  { bg: '#FDBA74', text: '#7C2D12' }, // orange
  { bg: '#A5B4FC', text: '#312E81' }, // indigo
  { bg: '#F0ABFC', text: '#701A75' }, // fuchsia
]

/** Stable colour pick based on any string ID — same ID always gets same colour */
export function avatarStyle(id: string) {
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

/** First letter of first name + first letter of last name, uppercased */
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
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-sm',
}

export function Avatar({ id, name, size = 'md' }: AvatarProps) {
  const { bg, text } = avatarStyle(id)
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center shrink-0 font-bold tracking-wide`}
      style={{ backgroundColor: bg, color: text }}
    >
      {getInitials(name)}
    </div>
  )
}
