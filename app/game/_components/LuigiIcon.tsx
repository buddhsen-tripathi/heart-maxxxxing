'use client'

/*
 * Pixel-art Luigi head/bust — 10x10 grid, SVG rects.
 * Green palette to contrast Mario's red. Used as the chat button icon.
 */

const C = {
  _: 'transparent',
  G: '#00A800', // green — cap
  S: '#FCA044', // skin
  B: '#6C3400', // brown — hair
  K: '#000000', // black — eyes
  W: '#FFFFFF', // white — eyes
} as const

type PaletteKey = keyof typeof C

// Luigi face (10x10 grid)
const LUIGI: PaletteKey[][] = [
  ['_','_','_','G','G','G','G','_','_','_'],
  ['_','_','G','G','G','G','G','G','_','_'],
  ['_','G','G','G','G','G','G','G','G','_'],
  ['_','_','B','B','B','S','S','K','S','_'],
  ['_','B','S','B','S','S','S','K','S','S'],
  ['_','B','B','S','S','S','S','K','K','K'],
  ['_','_','_','S','S','S','S','S','_','_'],
  ['_','_','G','G','G','G','G','G','_','_'],
  ['_','G','G','G','G','G','G','G','G','_'],
  ['_','_','G','G','G','G','G','G','_','_'],
]

const PX = 2.5
const GRID = 10

export default function LuigiIcon({ size = 28 }: { size?: number }) {
  const rects: React.ReactNode[] = []
  for (let y = 0; y < LUIGI.length; y++) {
    for (let x = 0; x < LUIGI[y].length; x++) {
      const key = LUIGI[y][x]
      if (key === '_') continue
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * PX}
          y={y * PX}
          width={PX}
          height={PX}
          fill={C[key]}
        />,
      )
    }
  }
  const viewSize = GRID * PX
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {rects}
    </svg>
  )
}
