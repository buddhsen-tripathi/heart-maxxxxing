'use client'

interface StormOverlayProps {
  level: 1 | 2 // 1 = subtle clouds, 2 = dark + rain
}

export default function StormOverlay({ level }: StormOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Dark overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          level >= 2 ? 'bg-gray-900/50' : 'bg-gray-800/25'
        }`}
      />

      {/* Storm clouds */}
      <div className="absolute top-0 left-0 right-0 h-24">
        <div
          className={`w-full h-full ${
            level >= 2
              ? 'bg-gradient-to-b from-gray-700/80 to-transparent'
              : 'bg-gradient-to-b from-gray-600/40 to-transparent'
          }`}
        />
      </div>

      {/* Rain drops for level 2 */}
      {level >= 2 && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="raindrop absolute w-0.5 h-4 bg-blue-300/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                animationDelay: `${Math.random() * 1.2}s`,
                animationDuration: `${0.8 + Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Gentle message */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center">
        <p className="font-pixel text-[8px] text-gray-300/60">
          {level >= 2
            ? 'The world misses you...'
            : "It's been a while..."}
        </p>
      </div>
    </div>
  )
}
