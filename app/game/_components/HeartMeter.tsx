'use client'

interface HeartMeterProps {
  hearts: number
  pulse: boolean
}

const HEART_PATH = 'M10 17 C10 17 2 11 2 6.5 C2 3.5 4.5 2 6.5 2 C8.5 2 9.5 3 10 4 C10.5 3 11.5 2 13.5 2 C15.5 2 18 3.5 18 6.5 C18 11 10 17 10 17Z'

function HeartIcon({ fill, index }: { fill: 'full' | 'half' | 'empty'; index: number }) {
  const clipId = `halfClip-${index}`
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5 md:w-6 md:h-6">
      {fill === 'half' && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="10" height="20" />
          </clipPath>
        </defs>
      )}
      {/* Empty outline */}
      <path
        d={HEART_PATH}
        fill={fill === 'empty' ? '#1e3a5f' : 'none'}
        stroke="#64748b"
        strokeWidth="1"
      />
      {/* Filled portion */}
      {fill === 'full' && (
        <path d={HEART_PATH} fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
      )}
      {fill === 'half' && (
        <path d={HEART_PATH} fill="#ef4444" stroke="#991b1b" strokeWidth="1" clipPath={`url(#${clipId})`} />
      )}
      {/* Shine */}
      {fill !== 'empty' && (
        <ellipse cx="6" cy="6" rx="2" ry="1.5" fill="rgba(255,255,255,0.3)" transform="rotate(-20 6 6)" />
      )}
    </svg>
  )
}

export default function HeartMeter({ hearts, pulse }: HeartMeterProps) {
  const fullHearts = Math.floor(hearts)
  const hasHalf = hearts % 1 !== 0
  const maxDisplay = 10

  const items: Array<'full' | 'half' | 'empty'> = []
  for (let i = 0; i < maxDisplay; i++) {
    if (i < fullHearts) {
      items.push('full')
    } else if (i === fullHearts && hasHalf) {
      items.push('half')
    } else {
      items.push('empty')
    }
  }

  return (
    <div className={`flex gap-0.5 flex-wrap ${pulse ? 'heart-new' : ''}`}>
      {items.map((fill, i) => (
        <HeartIcon key={i} fill={fill} index={i} />
      ))}
    </div>
  )
}
