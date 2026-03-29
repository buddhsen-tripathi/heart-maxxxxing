'use client'

import { type Powerup, getPowerupColor } from '../../lib/powerups'

interface PowerupModalProps {
  powerup: Powerup
  loading?: boolean
  onClose: () => void
}

export default function PowerupModal({ powerup, loading, onClose }: PowerupModalProps) {
  const gradientClass = getPowerupColor(powerup.type)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="modal-enter w-full max-w-sm">
        {/* Card */}
        <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-1 shadow-2xl`}>
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 text-center">
            {/* Icon */}
            <div className="text-5xl mb-3">{powerup.icon}</div>

            {/* Type label */}
            <div className="font-pixel text-[9px] text-gray-400 uppercase tracking-wider mb-2">
              {powerup.type === 'celebration' ? 'Final Reward' : `Session ${powerup.session} Reward`}
            </div>

            {/* Title */}
            <h3 className="font-pixel text-sm text-white mb-4 leading-relaxed">
              {powerup.title}
            </h3>

            {/* Content — with loading state */}
            <div className="min-h-[60px] mb-6">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-gray-400 text-xs font-pixel">Generating...</p>
                </div>
              ) : (
                <p className="text-gray-200 text-sm leading-relaxed">
                  {powerup.content}
                </p>
              )}
            </div>

            {/* Goal progress bar for goal-progress type */}
            {powerup.type === 'goal-progress' && !loading && (
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round((powerup.session / 36) * 100)}%` }}
                />
              </div>
            )}

            {/* Dismiss */}
            <button
              onClick={onClose}
              disabled={loading}
              className="py-3 px-8 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-wait text-white font-pixel text-[10px] rounded-lg transition-colors active:scale-95"
            >
              {loading ? 'WAIT...' : 'GOT IT!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
