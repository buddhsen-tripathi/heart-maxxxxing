'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  type GameState,
  loadState,
  saveState,
  getHearts,
  hasBrickAt,
  daysSinceLastSession,
  TOTAL_SESSIONS,
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
  const [isHopping, setIsHopping] = useState(false)
  const [gfitConnected, setGfitConnected] = useState(false)
  const [healthTrends, setHealthTrends] = useState<HealthTrends | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)

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

  // Check Google Fit connection (runs once on mount)
  useEffect(() => {
    setGfitConnected(document.cookie.includes('gfit_connected=true'))
  }, [])

  // Fetch health trends once state is loaded and connected
  // Simulates program timeline: 3 sessions/week, so session 9 = 3 weeks ago, session 36 = 12 weeks ago
  useEffect(() => {
    if (!gfitConnected || !state) return

    const weeksElapsed = state.currentSession / 3
    const virtualStartMs = Date.now() - weeksElapsed * 7 * 24 * 60 * 60 * 1000
    const startDate = new Date(virtualStartMs).toISOString()
    const url = `/api/fitbit/data?startDate=${encodeURIComponent(startDate)}`

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

    // Check if walk crosses a pipe — Mario hops over it
    const PIPE_POSITIONS = [5, 14, 23, 32]
    const crossesPipe = PIPE_POSITIONS.includes(nextSession) || PIPE_POSITIONS.includes(state.currentSession)

    // 1. Start walking animation + immediately move position (CSS transition handles slide)
    setIsWalking(true)
    if (crossesPipe) setIsHopping(true)
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
      setIsHopping(false)

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

  /** Fetch personalized powerup content from LLM, fall back to static */
  const fetchPersonalizedPowerup = useCallback(
    async (session: number, gameState: GameState) => {
      const meta = getPowerupMeta(session)
      if (!meta) return null

      const fallback = getPowerup(session, gameState.goal)
      const progress = Math.round((session / TOTAL_SESSIONS) * 100)

      // Show skeleton immediately (loading state)
      const skeleton: Powerup = { ...meta, content: '' }
      setActivePowerup(skeleton)
      setPowerupLoading(true)

      try {
        const health = healthTrends
          ? {
              restingHR: healthTrends.current.restingHR,
              baselineHR: healthTrends.baseline.avgRestingHR,
              deltaHR: healthTrends.deltas.restingHR,
              stepsToday: healthTrends.current.stepsToday,
              deltaSteps: healthTrends.deltas.dailySteps,
              totalSteps: healthTrends.totals.totalSteps,
              activeMinutes: healthTrends.current.activeMinutes,
              deltaActiveMinutes: healthTrends.deltas.activeMinutes,
              totalDistance: healthTrends.totals.totalDistance,
              programDays: healthTrends.totals.programDays,
            }
          : undefined

        const res = await fetch('/api/powerup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session,
            goal: gameState.goal,
            playerName: gameState.playerName,
            type: meta.type,
            progress,
            health,
          }),
        })

        if (!res.ok) throw new Error('API error')
        const { content } = await res.json()
        setActivePowerup({ ...meta, content })
      } catch {
        if (fallback) setActivePowerup(fallback)
      } finally {
        setPowerupLoading(false)
      }

      return meta
    },
    [healthTrends],
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
    <div className="min-h-screen bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900 flex flex-col">
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
      />

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
