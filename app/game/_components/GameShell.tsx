'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  type GameState,
  loadState,
  saveState,
  getHearts,
  hasBrickAt,
  daysSinceLastSession,
  TOTAL_SESSIONS,
  getCurrentAct,
} from '../../lib/game-state'
import { getPowerup, getPowerupMeta, type Powerup } from '../../lib/powerups'
import type { HealthTrends } from '../../lib/fitbit'
import GameLevel from './GameLevel'
import GameHUD from './GameHUD'
import PowerupModal from './PowerupModal'
import ChatPanel from './ChatPanel'
import StormOverlay from './StormOverlay'
import CompletionScreen from './CompletionScreen'
import FitbitConnectModal from './FitbitConnectModal'
import HealthInsightsPanel from './HealthInsightsPanel'

export default function GameShell() {
  const router = useRouter()
  const [state, setState] = useState<GameState | null>(null)
  const [isWalking, setIsWalking] = useState(false)
  const [activePowerup, setActivePowerup] = useState<Powerup | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [heartPulse, setHeartPulse] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [powerupLoading, setPowerupLoading] = useState(false)
  const [jumpPhase, setJumpPhase] = useState<'none' | 'hit' | 'grab'>('none')
  const [bumpingBrick, setBumpingBrick] = useState<number | null>(null)
  const [poppingBrick, setPoppingBrick] = useState<number | null>(null)
  const [grabbingPowerup, setGrabbingPowerup] = useState(false)
  const [isHopping] = useState(false)
  const [gfitConnected, setGfitConnected] = useState(false)
  const [healthTrends, setHealthTrends] = useState<HealthTrends | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const powerupCacheRef = useRef<Map<number, string>>(new Map())

  // Load state on mount
  useEffect(() => {
    const saved = loadState()
    if (!saved || !saved.playerName) {
      router.push('/')
      return
    }
    setState(saved)
    if (saved.currentSession >= TOTAL_SESSIONS) {
      setShowCompletion(true)
    }
  }, [router])

  // Check Fitbit connection (runs once on mount)
  useEffect(() => {
    setGfitConnected(document.cookie.includes('fitbit_connected=true'))
  }, [])

  // Initialize background music
  useEffect(() => {
    const audio = new Audio('/01. Ground Theme.mp3')
    audio.loop = true
    audio.volume = 0.3
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) {
      audio.pause()
      setMusicPlaying(false)
    } else {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }, [musicPlaying])

  // Fetch health trends once state is loaded and connected
  // Program starts Nov 1 2025, 3 sessions/week with 2-3-2 day gaps
  // Session 1: Nov 1, Session 2: Nov 3, Session 3: Nov 6, Session 4: Nov 8, ...
  useEffect(() => {
    if (!gfitConnected || !state) return

    const PROGRAM_START = new Date('2025-11-01').getTime()
    const DAY = 24 * 60 * 60 * 1000
    // 2-3-2-2-3-2 repeating pattern (days between sessions)
    const GAP_PATTERN = [2, 3, 2]
    let dayOffset = 0
    for (let i = 1; i < state.currentSession; i++) {
      dayOffset += GAP_PATTERN[(i - 1) % 3]
    }
    const virtualNow = PROGRAM_START + dayOffset * DAY
    const startDate = new Date(PROGRAM_START).toISOString()
    const url = `/api/fitbit/data?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(new Date(virtualNow).toISOString())}`

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.text().catch(() => '')
          console.error(`[GFit] API ${res.status}:`, errBody)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          console.log('[GFit] Trends:', data)
          setHealthTrends(data)
        }
      })
      .catch((err) => console.error('[GFit] Fetch error:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gfitConnected, state?.playerName, state?.currentSession])

  const completeSession = useCallback(() => {
    if (!state || isWalking || state.currentSession >= TOTAL_SESSIONS) return

    const nextSession = state.currentSession + 1

    // 1. Start walking animation + immediately move position (CSS transition handles slide)
    setIsWalking(true)
    const newState: GameState = {
      ...state,
      currentSession: nextSession,
      completedSessions: [...state.completedSessions, nextSession],
      lastSessionDate: new Date().toISOString(),
    }
    setState(newState)
    saveState(newState)

    // 2. After Mario arrives (match CSS transition duration), stop walking
    setTimeout(() => {
      setIsWalking(false)

      // Heart pulse on even sessions
      if (nextSession % 2 === 0) {
        setHeartPulse(true)
        setTimeout(() => setHeartPulse(false), 600)
      }

      // If there's a brick here, Mario jumps and punches it!
      if (hasBrickAt(nextSession) && !state.viewedPowerups.includes(nextSession)) {
        triggerBrickPunch(nextSession, newState)
      }

      // Check for completion
      if (nextSession >= TOTAL_SESSIONS) {
        setTimeout(() => setShowCompletion(true), 1200)
      }
    }, 1000)
  }, [state, isWalking])

  /** Build health context for powerup API */
  const buildHealthContext = useCallback(() => {
    if (!healthTrends) return undefined
    return {
      restingHR: healthTrends.current.restingHR,
      baselineHR: healthTrends.baseline.avgRestingHR,
      deltaHR: healthTrends.deltas.restingHR,
      stepsToday: healthTrends.current.stepsToday,
      deltaSteps: healthTrends.deltas.dailySteps,
      totalSteps: healthTrends.totals.totalSteps,
      activeMinutes: healthTrends.current.activeMinutes,
      deltaActiveMinutes: healthTrends.deltas.activeMinutes,
      totalDistance: (healthTrends.totals as Record<string, unknown>).totalDistance as number | undefined,
      programDays: healthTrends.totals.programDays,
    }
  }, [healthTrends])

  /** Build patient profile for powerup API */
  const buildPatientProfile = useCallback((session: number, gameState: GameState) => {
    if (!gameState.profile) return undefined
    return {
      age: gameState.profile.age,
      gender: gameState.profile.gender,
      bloodPressure: gameState.profile.bloodPressure,
      restingHeartRate: gameState.profile.restingHeartRate,
      pastDiseases: gameState.profile.pastDiseases,
      rehabPhase: getCurrentAct(session, gameState.profile.rehabPlan)?.title,
    }
  }, [])

  /** Fetch powerup content from LLM (returns content string, doesn't touch UI) */
  const fetchPowerupContent = useCallback(
    async (session: number, gameState: GameState): Promise<string | null> => {
      const meta = getPowerupMeta(session)
      if (!meta) return null

      const progress = Math.round((session / TOTAL_SESSIONS) * 100)

      try {
        const res = await fetch('/api/powerup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session,
            goal: gameState.goal,
            playerName: gameState.playerName,
            type: meta.type,
            progress,
            health: buildHealthContext(),
            patientProfile: buildPatientProfile(session, gameState),
          }),
        })

        if (!res.ok) throw new Error('API error')
        const { content } = await res.json()
        return content
      } catch {
        return null
      }
    },
    [buildHealthContext, buildPatientProfile],
  )

  /** Next brick session from a given session */
  function nextBrickSession(current: number): number | null {
    const next = current + (3 - (current % 3 || 3))
    return next > 0 && next <= TOTAL_SESSIONS ? next : null
  }

  /** Preload the next powerup in the background */
  const preloadNextPowerup = useCallback(
    (fromSession: number, gameState: GameState) => {
      const next = nextBrickSession(fromSession + 1)
      if (!next || powerupCacheRef.current.has(next)) return

      console.log(`[Preload] Fetching reward for session ${next}`)
      fetchPowerupContent(next, gameState).then((content) => {
        if (content) {
          powerupCacheRef.current.set(next, content)
          console.log(`[Preload] Session ${next} ready`)
        }
      })
    },
    [fetchPowerupContent],
  )

  // Preload first upcoming powerup on mount + when session changes
  useEffect(() => {
    if (!state) return
    const next = nextBrickSession(state.currentSession + 1)
    if (next && !powerupCacheRef.current.has(next)) {
      preloadNextPowerup(state.currentSession, state)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.currentSession, state?.playerName, preloadNextPowerup])

  /** Show powerup — uses cache if available, falls back to live fetch */
  const fetchPersonalizedPowerup = useCallback(
    async (session: number, gameState: GameState) => {
      const meta = getPowerupMeta(session)
      if (!meta) return null

      const fallback = getPowerup(session, gameState.goal)

      // Check cache first
      const cached = powerupCacheRef.current.get(session)
      if (cached) {
        console.log(`[Preload] Cache hit for session ${session}`)
        powerupCacheRef.current.delete(session)
        setActivePowerup({ ...meta, content: cached })
        setPowerupLoading(false)

        // Preload the one after this
        preloadNextPowerup(session, gameState)
        return meta
      }

      // No cache — show skeleton and fetch live
      const skeleton: Powerup = { ...meta, content: '' }
      setActivePowerup(skeleton)
      setPowerupLoading(true)

      try {
        const content = await fetchPowerupContent(session, gameState)
        if (content) {
          setActivePowerup({ ...meta, content })
        } else if (fallback) {
          setActivePowerup(fallback)
        }
      } catch {
        if (fallback) setActivePowerup(fallback)
      } finally {
        setPowerupLoading(false)
      }

      // Preload the one after this
      preloadNextPowerup(session, gameState)
      return meta
    },
    [fetchPowerupContent, preloadNextPowerup],
  )

  /** Two-jump brick punch: jump1 hits brick → powerup pops → jump2 grabs it → modal */
  const triggerBrickPunch = useCallback(
    (session: number, gameState: GameState) => {
      // === JUMP 1: Hit the brick ===
      // 0ms — Mario jumps up
      setJumpPhase('hit')

      // 280ms — At peak, head hits brick → brick bumps + powerup pops out
      setTimeout(() => {
        setBumpingBrick(session)
        setPoppingBrick(session)
      }, 280)

      // 580ms — Brick bump settles
      setTimeout(() => {
        setBumpingBrick(null)
      }, 630)

      // 700ms — Mario lands from jump 1
      setTimeout(() => {
        setJumpPhase('none')
      }, 700)

      // === JUMP 2: Grab the powerup ===
      // 900ms — Mario jumps again (higher) to grab the floating powerup
      setTimeout(() => {
        setJumpPhase('grab')
      }, 900)

      // 1200ms — At peak of jump 2, grab the powerup (it shrinks into Mario)
      setTimeout(() => {
        setGrabbingPowerup(true)
      }, 1200)

      // 1600ms — Grab animation done, clear powerup pop
      setTimeout(() => {
        setGrabbingPowerup(false)
        setPoppingBrick(null)
      }, 1600)

      // 1650ms — Mario lands from jump 2
      setTimeout(() => {
        setJumpPhase('none')
      }, 1650)

      // 1800ms — Open modal + start LLM fetch
      setTimeout(() => {
        fetchPersonalizedPowerup(session, gameState)
        const updatedState = {
          ...gameState,
          viewedPowerups: [...gameState.viewedPowerups, session],
        }
        setState(updatedState)
        saveState(updatedState)
      }, 1800)
    },
    [fetchPersonalizedPowerup],
  )

  const handleBrickClick = useCallback(
    (session: number) => {
      if (!state || powerupLoading || jumpPhase !== 'none') return

      // If it's an already-opened brick, just re-show the powerup
      if (state.viewedPowerups.includes(session)) {
        fetchPersonalizedPowerup(session, state)
        return
      }

      // Mario jumps and punches the brick!
      triggerBrickPunch(session, state)
    },
    [state, powerupLoading, jumpPhase, triggerBrickPunch, fetchPersonalizedPowerup],
  )

  const closePowerup = useCallback(() => {
    setActivePowerup(null)
  }, [])

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-200 flex items-center justify-center">
        <div className="font-pixel text-sky-700 text-sm">Loading...</div>
      </div>
    )
  }

  const hearts = getHearts(state.currentSession)
  const daysSince = daysSinceLastSession(state)
  const stormLevel = daysSince > 5 ? 2 : daysSince > 2 ? 1 : 0

  return (
    <div className="h-dvh bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900 flex flex-col overflow-hidden">
      {/* HUD */}
      <GameHUD
        hearts={hearts}
        currentSession={state.currentSession}
        goal={state.goal}
        playerName={state.playerName}
        heartPulse={heartPulse}
        gfitConnected={gfitConnected}
        healthTrends={healthTrends}
        onConnectClick={() => setShowConnectModal(true)}
        onCompleteSession={completeSession}
        onToggleChat={() => setShowChat(!showChat)}
        sessionDisabled={isWalking || state.currentSession >= TOTAL_SESSIONS}
        isWalking={isWalking}
        chatOpen={showChat}
        musicPlaying={musicPlaying}
        onToggleMusic={toggleMusic}
      />

      {/* Health Insights */}
      {gfitConnected && healthTrends && (
        <HealthInsightsPanel
          trends={healthTrends}
          currentSession={state.currentSession}
          hideMilestone={!!activePowerup}
        />
      )}

      {/* Game Level */}
      <div className="flex-1 flex items-end relative">
        {stormLevel > 0 && <StormOverlay level={stormLevel as 1 | 2} />}
        <GameLevel
          currentSession={state.currentSession}
          isWalking={isWalking}
          isHopping={isHopping}
          jumpPhase={jumpPhase}
          bumpingBrick={bumpingBrick}
          poppingBrick={poppingBrick}
          grabbingPowerup={grabbingPowerup}
          viewedPowerups={state.viewedPowerups}
          onBrickClick={handleBrickClick}
        />
      </div>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel
          state={state}
          onClose={() => setShowChat(false)}
          healthTrends={healthTrends}
        />
      )}

      {/* Powerup Modal */}
      {activePowerup && (
        <PowerupModal powerup={activePowerup} loading={powerupLoading} onClose={closePowerup} />
      )}

      {/* Completion Screen */}
      {showCompletion && (
        <CompletionScreen
          playerName={state.playerName}
          hearts={hearts}
          goal={state.goal}
          healthTrends={healthTrends}
          onClose={() => setShowCompletion(false)}
        />
      )}

      {/* Google Fit Connect Modal */}
      {showConnectModal && (
        <FitbitConnectModal onClose={() => setShowConnectModal(false)} />
      )}
    </div>
  )
}
