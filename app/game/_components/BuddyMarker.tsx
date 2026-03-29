'use client'

/*
 * Small ghost sprites showing other patients' progress on the game level.
 * Each buddy is a simplified 8x8 pixel-art character with a unique color.
 * They're semi-transparent to not distract from the main player.
 */

interface BuddyMarkerProps {
  name: string
  session: number
  color: string // cap/shirt color
}

// Simplified 8x8 standing character (cap + face + body)
type P = '_' | 'C' | 'S' | 'K' | 'U'

const SPRITE: P[][] = [
  ['_','_','C','C','C','C','_','_'],
  ['_','C','C','C','C','C','C','_'],
  ['_','_','S','S','K','S','_','_'],
  ['_','S','S','S','S','K','S','_'],
  ['_','_','C','C','C','C','_','_'],
  ['_','C','U','C','C','U','C','_'],
  ['_','_','U','U','U','U','_','_'],
  ['_','_','U','_','_','U','_','_'],
]

const PX = 2.5
const GRID = 8

export default function BuddyMarker({ name, session, color }: BuddyMarkerProps) {
  const rects: React.ReactNode[] = []
  const colors: Record<P, string> = {
    _: 'transparent',
    C: color,
    S: '#FCA044',
    K: '#000000',
    U: '#2038EC',
  }

  for (let y = 0; y < SPRITE.length; y++) {
    for (let x = 0; x < SPRITE[y].length; x++) {
      const key = SPRITE[y][x]
      if (key === '_') continue
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * PX}
          y={y * PX}
          width={PX}
          height={PX}
          fill={colors[key]}
        />,
      )
    }
  }

  const size = GRID * PX
  const firstName = name.split(' ')[0]

  return (
    <div className="flex flex-col items-center gap-0.5 opacity-50 hover:opacity-90 transition-opacity">
      <span className="font-pixel text-[6px] text-white/70 whitespace-nowrap">{firstName}</span>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ imageRendering: 'pixelated' }}
      >
        {rects}
      </svg>
    </div>
  )
}
