'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadState, saveState, DEFAULT_STATE } from './lib/game-state'

const FLOATING_HEARTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 5}s`,
  duration: `${4 + Math.random() * 6}s`,
  size: 16 + Math.random() * 24,
}))

export default function WelcomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [hasExisting, setHasExisting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const existing = loadState()
    if (existing && existing.currentSession > 0) {
      setHasExisting(true)
    }
  }, [])

  function handleStart() {
    if (!name.trim() || !goal.trim()) return
    const state = {
      ...DEFAULT_STATE,
      playerName: name.trim(),
      goal: goal.trim(),
      startDate: new Date().toISOString(),
    }
    saveState(state)
    router.push('/game')
  }

  function handleContinue() {
    router.push('/game')
  }

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900 relative overflow-hidden flex items-center justify-center">
      {/* Floating hearts background */}
      {FLOATING_HEARTS.map((h) => (
        <div
          key={h.id}
          className="floating-heart absolute text-red-500/30 pointer-events-none select-none"
          style={{
            left: h.left,
            bottom: '-20px',
            ['--delay' as string]: h.delay,
            ['--duration' as string]: h.duration,
            fontSize: `${h.size}px`,
          }}
        >
          ♥
        </div>
      ))}

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">❤️</div>
          <h1 className="font-pixel text-2xl md:text-3xl text-red-400 mb-2 leading-relaxed">
            HEART
          </h1>
          <h1 className="font-pixel text-2xl md:text-3xl text-pink-300 mb-4 leading-relaxed">
            MAXXXXING
          </h1>
          <p className="text-sky-200 text-sm md:text-base max-w-sm mx-auto">
            Your cardiac rehab journey, reimagined as an adventure.
            36 sessions. One stronger heart.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-sky-950/70 backdrop-blur-sm border-2 border-sky-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
          {hasExisting && (
            <button
              onClick={handleContinue}
              className="w-full mb-6 py-4 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-pixel text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
            >
              ▶ CONTINUE JOURNEY
            </button>
          )}

          <div className={hasExisting ? 'pt-4 border-t border-sky-700/50' : ''}>
            {hasExisting && (
              <p className="text-sky-400 text-xs text-center mb-4">
                — or start fresh —
              </p>
            )}

            <label className="block mb-1 font-pixel text-[10px] text-sky-300 uppercase tracking-wider">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maria"
              className="w-full mb-5 px-4 py-3 bg-sky-900/60 border-2 border-sky-600/40 rounded-lg text-white placeholder:text-sky-600 focus:outline-none focus:border-pink-400/60 transition-colors"
              maxLength={30}
            />

            <label className="block mb-1 font-pixel text-[10px] text-sky-300 uppercase tracking-wider">
              Your Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Walk 30 minutes without stopping"
              rows={2}
              className="w-full mb-6 px-4 py-3 bg-sky-900/60 border-2 border-sky-600/40 rounded-lg text-white placeholder:text-sky-600 focus:outline-none focus:border-pink-400/60 transition-colors resize-none"
              maxLength={100}
            />

            <button
              onClick={handleStart}
              disabled={!name.trim() || !goal.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-pixel text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/40 disabled:shadow-none"
            >
              {hasExisting ? 'START NEW JOURNEY' : '♥ BEGIN YOUR QUEST'}
            </button>
          </div>
        </div>

        <p className="text-center text-sky-500/60 text-xs mt-6">
          A gamified cardiac rehabilitation companion
        </p>
      </div>
    </div>
  )
}
