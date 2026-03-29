'use client'

import { useRef, useEffect, useMemo } from 'react'
import { TOTAL_SESSIONS, hasBrickAt } from '../../lib/game-state'
import Character from './Character'
import Brick from './Brick'

interface GameLevelProps {
  currentSession: number
  isWalking: boolean
  isHopping: boolean
  jumpPhase: 'none' | 'hit' | 'grab'
  bumpingBrick: number | null
  poppingBrick: number | null
  grabbingPowerup: boolean
  viewedPowerups: number[]
  onBrickClick: (session: number) => void
}

/** Map powerup type index to an emoji that pops out of the brick */
const POWERUP_POP_ICONS: Record<number, string> = {
  3: '🍄', 6: '🎯', 9: '💌', 12: '⭐', 15: '❤️',
  18: '🍄', 21: '🎯', 24: '💌', 27: '🏆', 30: '❤️',
  33: '🍄', 36: '👑',
}

const BLOCK_WIDTH = 80
// Pipes placed between brick sessions so they don't overlap with Mario at brick positions
const PIPE_POSITIONS = [5, 14, 23, 32]

/* ===== NES-style Cloud with cyan bottom highlight ===== */
function Cloud({ left, top, scale }: { left: number; top: number; scale: number }) {
  return (
    <div
      className="cloud absolute pointer-events-none"
      style={{ left, top, transform: `scale(${scale})` }}
    >
      <svg width="96" height="56" viewBox="0 0 96 56" style={{ imageRendering: 'pixelated' }}>
        {/* Main body */}
        <ellipse cx="48" cy="36" rx="44" ry="18" fill="white" />
        {/* Top bumps */}
        <ellipse cx="30" cy="22" rx="18" ry="16" fill="white" />
        <ellipse cx="56" cy="18" rx="22" ry="18" fill="white" />
        <ellipse cx="68" cy="26" rx="14" ry="12" fill="white" />
        {/* Cyan bottom highlight — classic NES */}
        <ellipse cx="48" cy="42" rx="38" ry="8" fill="#80d8ff" opacity="0.4" />
        {/* Eyes (subtle, like NES clouds) */}
        <rect x="32" y="30" width="4" height="6" rx="1" fill="#6b88ff" opacity="0.35" />
        <rect x="50" y="30" width="4" height="6" rx="1" fill="#6b88ff" opacity="0.35" />
      </svg>
    </div>
  )
}

/* ===== NES-style Hill with bush spots ===== */
function Hill({ width, height, left, hasBushSpots }: { width: number; height: number; left: number; hasBushSpots?: boolean }) {
  const spots = hasBushSpots
    ? [
        { cx: width * 0.25, cy: height * 0.45, r: height * 0.12 },
        { cx: width * 0.5, cy: height * 0.3, r: height * 0.1 },
        { cx: width * 0.7, cy: height * 0.5, r: height * 0.14 },
        { cx: width * 0.35, cy: height * 0.65, r: height * 0.09 },
        { cx: width * 0.6, cy: height * 0.6, r: height * 0.11 },
      ]
    : []

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left, bottom: 48, width, height }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Hill shape */}
        <ellipse
          cx={width / 2}
          cy={height}
          rx={width / 2}
          ry={height}
          fill="#00a800"
        />
        {/* Lighter top highlight */}
        <ellipse
          cx={width / 2}
          cy={height + height * 0.1}
          rx={width / 2 - 8}
          ry={height * 0.85}
          fill="#80d010"
        />
        {/* Dark bush spots */}
        {spots.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#005800" opacity="0.6" />
        ))}
      </svg>
    </div>
  )
}

/* ===== Bush (recolored cloud shape, sits on ground) ===== */
function Bush({ left, scale }: { left: number; scale: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left, bottom: 44, transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
    >
      <svg width="80" height="36" viewBox="0 0 80 36">
        <ellipse cx="40" cy="24" rx="36" ry="12" fill="#00a800" />
        <ellipse cx="24" cy="16" rx="14" ry="12" fill="#00a800" />
        <ellipse cx="48" cy="14" rx="16" ry="14" fill="#00a800" />
        <ellipse cx="60" cy="20" rx="10" ry="9" fill="#00a800" />
        {/* Lighter inner */}
        <ellipse cx="40" cy="22" rx="28" ry="8" fill="#80d010" opacity="0.6" />
        <ellipse cx="30" cy="16" rx="8" ry="6" fill="#80d010" opacity="0.5" />
        <ellipse cx="50" cy="16" rx="9" ry="7" fill="#80d010" opacity="0.5" />
      </svg>
    </div>
  )
}

export default function GameLevel({
  currentSession,
  isWalking,
  isHopping,
  jumpPhase,
  bumpingBrick,
  poppingBrick,
  grabbingPowerup,
  viewedPowerups,
  onBrickClick,
}: GameLevelProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  const cameraOffset = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800
    const characterX = currentSession * BLOCK_WIDTH + BLOCK_WIDTH / 2
    const offset = characterX - viewportWidth / 2
    return Math.max(0, offset)
  }, [currentSession])

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ left: cameraOffset, behavior: 'smooth' })
    }
  }, [cameraOffset])

  const totalWidth = (TOTAL_SESSIONS + 4) * BLOCK_WIDTH

  return (
    <div
      ref={viewportRef}
      className="game-viewport w-full h-80 md:h-[420px] no-scrollbar overflow-x-auto"
    >
      <div className="relative" style={{ width: totalWidth, height: '100%' }}>
        {/* ===== Sky is set by .game-viewport background ===== */}

        {/* ===== Clouds ===== */}
        <Cloud left={80} top={24} scale={0.9} />
        <Cloud left={480} top={50} scale={0.7} />
        <Cloud left={900} top={20} scale={1} />
        <Cloud left={1350} top={55} scale={0.65} />
        <Cloud left={1800} top={30} scale={0.85} />
        <Cloud left={2300} top={45} scale={0.75} />
        <Cloud left={2700} top={18} scale={0.9} />

        {/* ===== Hills ===== */}
        <Hill width={220} height={70} left={30} hasBushSpots />
        <Hill width={140} height={45} left={350} />
        <Hill width={300} height={90} left={700} hasBushSpots />
        <Hill width={160} height={50} left={1100} />
        <Hill width={260} height={75} left={1500} hasBushSpots />
        <Hill width={180} height={55} left={1900} />
        <Hill width={280} height={80} left={2300} hasBushSpots />

        {/* ===== Bushes ===== */}
        <Bush left={200} scale={0.8} />
        <Bush left={550} scale={1} />
        <Bush left={1000} scale={0.7} />
        <Bush left={1400} scale={0.9} />
        <Bush left={1850} scale={0.75} />
        <Bush left={2500} scale={1} />

        {/* ===== ? Bricks ===== */}
        {Array.from({ length: TOTAL_SESSIONS }, (_, i) => i + 1).map((session) => {
          if (!hasBrickAt(session)) return null
          const brickState =
            viewedPowerups.includes(session)
              ? 'opened'
              : session <= currentSession
                ? 'ready'
                : 'locked'
          const isBumping = bumpingBrick === session
          const isPopping = poppingBrick === session
          return (
            <div
              key={`brick-${session}`}
              className="absolute"
              style={{
                left: session * BLOCK_WIDTH + (BLOCK_WIDTH - 48) / 2,
                bottom: 250,
              }}
            >
              {/* Powerup item: pops out of brick, then grabbed by Mario */}
              {isPopping && (
                <div
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 text-2xl z-20 ${
                    grabbingPowerup ? 'powerup-grabbed' : 'powerup-popping'
                  }`}
                >
                  {POWERUP_POP_ICONS[session] || '🍄'}
                </div>
              )}
              <div className={isBumping ? 'brick-bumping' : ''}>
                <Brick
                  session={session}
                  state={brickState}
                  onClick={() => onBrickClick(session)}
                />
              </div>
            </div>
          )
        })}

        {/* ===== Pipes ===== */}
        {PIPE_POSITIONS.map((pos) => (
          <div
            key={`pipe-${pos}`}
            style={{ left: pos * BLOCK_WIDTH + (BLOCK_WIDTH - 56) / 2 }}
            className="absolute bottom-12 z-[5]"
          >
            <div className="pipe-top" />
            <div className="pipe-body" />
          </div>
        ))}

        {/* ===== Character (Mario) ===== */}
        <div
          className={`character absolute z-[15] ${
            jumpPhase === 'hit' ? 'mario-jumping'
              : jumpPhase === 'grab' ? 'mario-jumping-grab'
                : isHopping ? 'mario-hopping'
                  : ''
          }`}
          style={{
            left: currentSession * BLOCK_WIDTH + (BLOCK_WIDTH - 56) / 2,
            bottom: 50,
          }}
        >
          <Character isWalking={isWalking} />
        </div>

        {/* Dust puff behind Mario when walking */}
        {isWalking && (
          <div
            className="absolute z-[9] pointer-events-none"
            style={{
              left: (currentSession - 1) * BLOCK_WIDTH + BLOCK_WIDTH / 2,
              bottom: 52,
            }}
          >
            <div className="dust-puff w-4 h-4 rounded-full bg-[#d8c8a0] opacity-60" />
          </div>
        )}

        {/* ===== Ground row — brick-pattern blocks ===== */}
        <div className="absolute bottom-0 left-0 flex">
          {/* Starting platform */}
          <div className="ground-block">
            <div className="ground-block-inner flex items-center justify-center">
              <span className="font-pixel text-[7px] text-white/70 drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                START
              </span>
            </div>
          </div>

          {/* 36 session blocks */}
          {Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
            const session = i + 1
            const isCompleted = session <= currentSession
            const isCurrent = session === currentSession + 1
            return (
              <div key={session} className="ground-block relative">
                <div className="ground-block-inner" />
                {/* Session number overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  <span
                    className={`font-pixel text-[7px] drop-shadow-[0_1px_0_rgba(0,0,0,0.6)] ${
                      isCompleted
                        ? 'text-yellow-300'
                        : isCurrent
                          ? 'text-white'
                          : 'text-white/30'
                    }`}
                  >
                    {session}
                  </span>
                  {isCompleted && (
                    <span className="text-yellow-300 text-[8px] drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* End blocks */}
          {Array.from({ length: 3 }, (_, i) => (
            <div key={`end-${i}`} className="ground-block">
              <div className="ground-block-inner" />
            </div>
          ))}
        </div>

        {/* ===== Finish flag ===== */}
        <div
          className="absolute bottom-12 z-[5]"
          style={{ left: TOTAL_SESSIONS * BLOCK_WIDTH + BLOCK_WIDTH / 2 }}
        >
          <div className="relative">
            <div className="w-1.5 h-24 bg-white" />
            {/* Checkerboard flag */}
            <div className="absolute top-0 left-2 w-12 h-8 overflow-hidden border border-white/60">
              <div
                className="w-full h-full"
                style={{
                  background: `repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0 / 8px 8px`,
                }}
              />
            </div>
            <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
