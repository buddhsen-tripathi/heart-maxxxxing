'use client'

import { TOTAL_SESSIONS } from '../../lib/game-state'
import type { HealthTrends } from '../../lib/fitbit'

interface CompletionScreenProps {
  playerName: string
  hearts: number
  goal: string
  healthTrends?: HealthTrends | null
  onClose: () => void
}

export default function CompletionScreen({
  playerName,
  hearts,
  goal,
  healthTrends,
  onClose,
}: CompletionScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Fireworks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="firework absolute text-2xl"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 1.5}s`,
            }}
          >
            {['✨', '🎉', '⭐', '💛', '❤️', '🎊'][i % 6]}
          </div>
        ))}
      </div>

      <div className="modal-enter relative z-10 w-full max-w-md text-center">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 rounded-2xl p-1 shadow-2xl">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-8">
            {/* Crown */}
            <div className="text-6xl mb-4">👑</div>

            {/* Title */}
            <h2 className="font-pixel text-xl text-amber-400 mb-2 leading-relaxed">
              YOU DID IT!
            </h2>
            <p className="font-pixel text-[10px] text-pink-300 mb-6">
              {playerName}&apos;s Journey is Complete
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl mb-1">❤️</div>
                <div className="font-pixel text-[8px] text-gray-400">Hearts</div>
                <div className="font-pixel text-sm text-red-400">{hearts}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl mb-1">🏃</div>
                <div className="font-pixel text-[8px] text-gray-400">Sessions</div>
                <div className="font-pixel text-sm text-emerald-400">{TOTAL_SESSIONS}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl mb-1">📉</div>
                <div className="font-pixel text-[8px] text-gray-400">Risk Cut</div>
                <div className="font-pixel text-sm text-blue-400">43%</div>
              </div>
            </div>

            {/* Goal */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="font-pixel text-[8px] text-gray-400 mb-2">YOUR GOAL</div>
              <p className="text-white text-sm">&quot;{goal}&quot;</p>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" />
              </div>
              <div className="font-pixel text-[8px] text-emerald-400 mt-1">100% ACHIEVED</div>
            </div>

            {/* Health Progress (if connected) */}
            {healthTrends && (healthTrends.deltas.restingHR != null || healthTrends.totals.totalSteps != null) && (
              <div className="bg-teal-900/30 border border-teal-500/30 rounded-lg p-4 mb-6">
                <div className="font-pixel text-[8px] text-teal-400 mb-3">YOUR BODY&apos;S PROGRESS</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {healthTrends.deltas.restingHR != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Resting HR</span>
                      <div className="text-emerald-400 font-pixel text-xs">
                        {healthTrends.deltas.restingHR > 0 ? '+' : ''}{healthTrends.deltas.restingHR} BPM
                      </div>
                    </div>
                  )}
                  {healthTrends.totals.totalSteps != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Total Steps</span>
                      <div className="text-emerald-400 font-pixel text-xs">
                        {healthTrends.totals.totalSteps.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {healthTrends.deltas.dailySteps != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Daily Steps</span>
                      <div className="text-emerald-400 font-pixel text-xs">
                        {healthTrends.deltas.dailySteps > 0 ? '+' : ''}{healthTrends.deltas.dailySteps.toLocaleString()}/day
                      </div>
                    </div>
                  )}
                  {healthTrends.totals.totalDistance != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Distance</span>
                      <div className="text-emerald-400 font-pixel text-xs">
                        {(healthTrends.totals.totalDistance / 1000).toFixed(1)} km
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              You&apos;ve reduced your risk of rehospitalization by <strong className="text-white">43%</strong>.
              Your heart — and everyone who loves you — thanks you. 💕
            </p>

            <button
              onClick={onClose}
              className="py-3 px-8 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-pixel text-[10px] rounded-lg transition-all active:scale-95"
            >
              KEEP GOING
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
