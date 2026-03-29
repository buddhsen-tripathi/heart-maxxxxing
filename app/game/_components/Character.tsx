'use client'

/*
 * Pixel-art Mario with a heart-themed shirt.
 * Built with SVG rects on a 16x16 grid.
 * Two walk frames + standing, toggled via props.
 * Each "pixel" = 3.5 SVG units → 56×56 rendered.
 */

interface CharacterProps {
  isWalking: boolean
}

// Color palette
const C = {
  _: 'transparent',
  R: '#FF2060', // heart pink-red — cap, shirt
  S: '#FCA044', // skin
  B: '#6C3400', // brown — hair, shoes
  U: '#2038EC', // blue — overalls
  W: '#FFFFFF', // white — gloves, eyes
  K: '#000000', // black — eyes, outline
  Y: '#FCB800', // yellow — overall buttons
  H: '#FFFFFF', // white — heart emblem on shirt
} as const

type PaletteKey = keyof typeof C

// Standing frame — heart emblem on right chest (cols 7,8,9 / rows 7,8)
const FRAME_STAND: PaletteKey[][] = [
  ['_','_','_','_','_','R','R','R','R','R','_','_','_','_','_','_'],
  ['_','_','_','_','R','R','R','R','R','R','R','R','R','_','_','_'],
  ['_','_','_','_','B','B','B','S','S','K','S','_','_','_','_','_'],
  ['_','_','_','B','S','B','S','S','S','K','S','S','S','_','_','_'],
  ['_','_','_','B','S','B','B','S','S','S','K','S','S','S','_','_'],
  ['_','_','_','B','B','S','S','S','S','K','K','K','K','_','_','_'],
  ['_','_','_','_','_','S','S','S','S','S','S','S','_','_','_','_'],
  ['_','_','_','_','R','R','U','H','R','H','_','_','_','_','_','_'],
  ['_','_','_','R','R','R','U','R','H','U','R','R','R','_','_','_'],
  ['_','_','_','R','R','R','U','U','U','U','R','R','R','_','_','_'],
  ['_','_','_','S','S','U','Y','U','U','Y','U','S','S','_','_','_'],
  ['_','_','_','S','S','U','U','U','U','U','U','S','S','_','_','_'],
  ['_','_','_','S','S','U','U','U','U','U','U','S','S','_','_','_'],
  ['_','_','_','_','_','U','U','_','_','U','U','_','_','_','_','_'],
  ['_','_','_','_','B','B','B','_','_','B','B','B','_','_','_','_'],
  ['_','_','_','B','B','B','B','_','_','B','B','B','B','_','_','_'],
]

// Walking frame 1 — heart on left chest (cols 3,4,5 / rows 7,8)
const FRAME_WALK: PaletteKey[][] = [
  ['_','_','_','_','_','R','R','R','R','R','_','_','_','_','_','_'],
  ['_','_','_','_','R','R','R','R','R','R','R','R','R','_','_','_'],
  ['_','_','_','_','B','B','B','S','S','K','S','_','_','_','_','_'],
  ['_','_','_','B','S','B','S','S','S','K','S','S','S','_','_','_'],
  ['_','_','_','B','S','B','B','S','S','S','K','S','S','S','_','_'],
  ['_','_','_','B','B','S','S','S','S','K','K','K','K','_','_','_'],
  ['_','_','_','_','_','S','S','S','S','S','S','S','_','_','_','_'],
  ['_','_','_','H','R','H','U','U','R','R','_','_','_','_','_','_'],
  ['_','_','R','R','H','R','U','U','R','R','R','S','_','_','_','_'],
  ['_','_','S','R','R','U','U','U','U','R','R','S','_','_','_','_'],
  ['_','_','S','S','U','Y','U','U','Y','U','S','S','_','_','_','_'],
  ['_','_','_','_','U','U','U','U','U','U','_','_','_','_','_','_'],
  ['_','_','_','_','U','U','U','U','U','_','_','_','_','_','_','_'],
  ['_','_','_','_','_','U','U','_','B','B','B','_','_','_','_','_'],
  ['_','_','_','_','_','B','B','B','B','B','_','_','_','_','_','_'],
  ['_','_','_','_','_','B','B','B','_','_','_','_','_','_','_','_'],
]

// Walking frame 2 — heart on right chest (cols 9,10,11 / rows 7,8)
const FRAME_WALK2: PaletteKey[][] = [
  ['_','_','_','_','_','R','R','R','R','R','_','_','_','_','_','_'],
  ['_','_','_','_','R','R','R','R','R','R','R','R','R','_','_','_'],
  ['_','_','_','_','B','B','B','S','S','K','S','_','_','_','_','_'],
  ['_','_','_','B','S','B','S','S','S','K','S','S','S','_','_','_'],
  ['_','_','_','B','S','B','B','S','S','S','K','S','S','S','_','_'],
  ['_','_','_','B','B','S','S','S','S','K','K','K','K','_','_','_'],
  ['_','_','_','_','_','S','S','S','S','S','S','S','_','_','_','_'],
  ['_','_','_','_','_','R','R','U','U','H','R','H','_','_','_','_'],
  ['_','_','_','_','S','R','R','U','U','R','H','R','R','_','_','_'],
  ['_','_','_','_','S','R','R','U','U','U','U','R','S','_','_','_'],
  ['_','_','_','_','S','S','U','Y','U','U','Y','U','S','_','_','_'],
  ['_','_','_','_','_','_','U','U','U','U','U','_','_','_','_','_'],
  ['_','_','_','_','_','_','_','U','U','U','U','_','_','_','_','_'],
  ['_','_','_','_','B','B','B','_','U','U','_','_','_','_','_','_'],
  ['_','_','_','_','_','B','B','B','B','_','_','_','_','_','_','_'],
  ['_','_','_','_','_','_','_','B','B','B','_','_','_','_','_','_'],
]

const PX = 3.5 // pixels per grid cell
const GRID = 16

function SpriteFrame({ frame }: { frame: PaletteKey[][] }) {
  const rects: React.ReactNode[] = []
  for (let y = 0; y < frame.length; y++) {
    for (let x = 0; x < frame[y].length; x++) {
      const key = frame[y][x]
      if (key === '_') continue
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * PX}
          y={y * PX}
          width={PX}
          height={PX}
          fill={C[key]}
        />
      )
    }
  }
  const size = GRID * PX
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="w-14 h-14"
      style={{ imageRendering: 'pixelated' }}
    >
      {rects}
    </svg>
  )
}

export default function Character({ isWalking }: CharacterProps) {
  if (!isWalking) {
    return (
      <div className="character-idle">
        <SpriteFrame frame={FRAME_STAND} />
      </div>
    )
  }

  return (
    <div className="character-walking relative w-14 h-14">
      {/* Walk frame 1 */}
      <div className="absolute inset-0 sprite-frame-1">
        <SpriteFrame frame={FRAME_WALK} />
      </div>
      {/* Walk frame 2 */}
      <div className="absolute inset-0 sprite-frame-2">
        <SpriteFrame frame={FRAME_WALK2} />
      </div>
    </div>
  )
}
