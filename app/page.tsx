'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadState, saveState, DEFAULT_STATE, DEFAULT_PROFILE, type PatientProfile } from './lib/game-state'

const FLOATING_HEARTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 5}s`,
  duration: `${4 + Math.random() * 6}s`,
  size: 16 + Math.random() * 24,
}))

const DISEASE_OPTIONS = [
  'hypertension',
  'type 2 diabetes',
  'coronary artery disease',
  'heart failure',
  'atrial fibrillation',
  'high cholesterol',
  'obesity',
  'COPD',
]

export default function WelcomePage() {
  const router = useRouter()
  const [name, setName] = useState('Maria')
  const [goal, setGoal] = useState('Walk 30 minutes without stopping')
  const [hasExisting, setHasExisting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Profile fields — pre-filled with demo data
  const [age, setAge] = useState(DEFAULT_PROFILE.age)
  const [gender, setGender] = useState(DEFAULT_PROFILE.gender)
  const [height, setHeight] = useState(DEFAULT_PROFILE.height)
  const [bp, setBp] = useState(DEFAULT_PROFILE.bloodPressure)
  const [rhr, setRhr] = useState(DEFAULT_PROFILE.restingHeartRate)
  const [diseases, setDiseases] = useState<string[]>(DEFAULT_PROFILE.pastDiseases)

  useEffect(() => {
    setMounted(true)
    const existing = loadState()
    if (existing && existing.currentSession > 0) {
      setHasExisting(true)
    }
  }, [])

  function toggleDisease(d: string) {
    setDiseases((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  function buildProfile(): PatientProfile {
    return {
      age,
      gender,
      height,
      bloodPressure: bp,
      restingHeartRate: rhr,
      pastDiseases: diseases,
      rehabPlan: DEFAULT_PROFILE.rehabPlan,
    }
  }

  function handleStart() {
    if (!name.trim() || !goal.trim()) return
    const state = {
      ...DEFAULT_STATE,
      playerName: name.trim(),
      goal: goal.trim(),
      startDate: new Date().toISOString(),
      profile: buildProfile(),
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
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Title */}
        <div className="text-center mb-6">
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
              <p className="text-sky-400 text-xs text-center mb-4">— or start fresh —</p>
            )}

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-pixel text-[10px] text-sky-300 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maria"
                  className="w-full px-3 py-2.5 bg-sky-900/60 border-2 border-sky-600/40 rounded-lg text-white placeholder:text-sky-600 focus:outline-none focus:border-pink-400/60 transition-colors text-sm"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block mb-1 font-pixel text-[10px] text-sky-300 uppercase tracking-wider">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-sky-900/60 border-2 border-sky-600/40 rounded-lg text-white focus:outline-none focus:border-pink-400/60 transition-colors text-sm"
                  min={18}
                  max={100}
                />
              </div>
            </div>

            <label className="block mb-1 font-pixel text-[10px] text-sky-300 uppercase tracking-wider">
              Your Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Walk 30 minutes without stopping"
              rows={2}
              className="w-full mb-4 px-3 py-2.5 bg-sky-900/60 border-2 border-sky-600/40 rounded-lg text-white placeholder:text-sky-600 focus:outline-none focus:border-pink-400/60 transition-colors resize-none text-sm"
              maxLength={120}
            />

            {/* Toggle medical profile */}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full mb-4 py-2 text-sky-400 hover:text-sky-300 text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span className="font-pixel text-[9px]">
                {showProfile ? '▼ HIDE' : '▶ EDIT'} MEDICAL PROFILE
              </span>
            </button>

            {/* Medical profile (collapsible) */}
            {showProfile && (
              <div className="mb-5 p-4 bg-sky-900/40 border border-sky-700/30 rounded-xl space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-pixel text-[8px] text-sky-400">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-2 py-2 bg-sky-900/60 border border-sky-600/40 rounded-lg text-white text-sm focus:outline-none focus:border-pink-400/60"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-pixel text-[8px] text-sky-400">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full px-2 py-2 bg-sky-900/60 border border-sky-600/40 rounded-lg text-white text-sm focus:outline-none focus:border-pink-400/60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-pixel text-[8px] text-sky-400">Blood Pressure</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      placeholder="120/80"
                      className="w-full px-2 py-2 bg-sky-900/60 border border-sky-600/40 rounded-lg text-white text-sm focus:outline-none focus:border-pink-400/60"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-pixel text-[8px] text-sky-400">Resting HR (bpm)</label>
                    <input
                      type="number"
                      value={rhr}
                      onChange={(e) => setRhr(Number(e.target.value))}
                      className="w-full px-2 py-2 bg-sky-900/60 border border-sky-600/40 rounded-lg text-white text-sm focus:outline-none focus:border-pink-400/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-pixel text-[8px] text-sky-400">Conditions</label>
                  <div className="flex flex-wrap gap-2">
                    {DISEASE_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDisease(d)}
                        className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                          diseases.includes(d)
                            ? 'bg-red-500/30 border-red-400/50 text-red-300'
                            : 'bg-sky-900/40 border-sky-700/40 text-sky-500 hover:border-sky-500'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rehab plan preview */}
                <div className="pt-3 border-t border-sky-700/30">
                  <div className="font-pixel text-[8px] text-sky-400 mb-2">REHAB PLAN: {DEFAULT_PROFILE.rehabPlan.title}</div>
                  <div className="space-y-1.5">
                    {DEFAULT_PROFILE.rehabPlan.acts.map((act) => (
                      <div key={act.id} className="flex items-center gap-2 text-[11px]">
                        <span className="text-amber-400">▸</span>
                        <span className="text-white/80">{act.title}</span>
                        <span className="text-sky-500">({act.missionsCount} sessions)</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-sky-500">
                    {DEFAULT_PROFILE.rehabPlan.totalSessions} sessions over {DEFAULT_PROFILE.rehabPlan.totalWeeks} weeks
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!name.trim() || !goal.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-pixel text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/40 disabled:shadow-none"
            >
              {hasExisting ? 'START NEW JOURNEY' : '♥ BEGIN YOUR QUEST'}
            </button>
          </div>
        </div>

        <p className="text-center text-sky-500/60 text-xs mt-6 pb-4">
          A gamified cardiac rehabilitation companion
        </p>
      </div>
    </div>
  )
}
