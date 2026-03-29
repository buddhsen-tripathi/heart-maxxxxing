'use client'

import HeartMeter from './HeartMeter'
import LuigiIcon from './LuigiIcon'
import { TOTAL_SESSIONS } from '../../lib/game-state'
import type { HealthTrends } from '../../lib/fitbit'
import { Check, Heart, Watch, MusicNote, MusicNoteSimple, Users } from '@phosphor-icons/react'
import type { Buddy } from '../../lib/buddies'

interface GameHUDProps {
  hearts: number
  currentSession: number
  goal: string
  playerName: string
  heartPulse: boolean
  gfitConnected: boolean
  healthTrends: HealthTrends | null
  onConnectClick: () => void
  onCompleteSession: () => void
  onToggleChat: () => void
  sessionDisabled: boolean
  isWalking: boolean
  chatOpen: boolean
  musicPlaying: boolean
  onToggleMusic: () => void
  buddies: Buddy[]
}

function Delta({ value, unit, invert }: { value?: number; unit: string; invert?: boolean }) {
  if (value == null || value === 0) return null
  const isGood = invert ? value < 0 : value > 0
  const arrow = value > 0 ? '\u2191' : '\u2193'
  const color = isGood ? 'text-emerald-400' : 'text-red-400'
  return (
    <span className={`${color} text-[9px] ml-0.5`}>
      {arrow}{Math.abs(value)}{unit}
    </span>
  )
}

export default function GameHUD({
  hearts,
  currentSession,
  goal,
  playerName,
  heartPulse,
  gfitConnected,
  healthTrends,
  onConnectClick,
  onCompleteSession,
  onToggleChat,
  sessionDisabled,
  isWalking,
  chatOpen,
  musicPlaying,
  onToggleMusic,
  buddies,
}: GameHUDProps) {
  const progress = Math.round((currentSession / TOTAL_SESSIONS) * 100)
  const isComplete = currentSession >= TOTAL_SESSIONS

  return (
    <div>
      {/* Main HUD bar: [Complete Session] — Player info — [Luigi Coach] */}
      <div className="flex items-center justify-between gap-2 p-2 md:p-3 bg-black border-b-4 border-[#a04000]">
        {/* Left: Complete Session button */}
        <button
          onClick={onCompleteSession}
          disabled={sessionDisabled}
          className="py-2 px-2.5 md:px-4 bg-[#e02020] hover:bg-[#ff3030] disabled:bg-[#444] disabled:cursor-not-allowed text-white font-pixel text-[7px] md:text-[10px] border-[3px] border-t-[#ff6060] border-l-[#ff6060] border-b-[#800000] border-r-[#800000] disabled:border-[#555] transition-all active:scale-95 shrink-0 whitespace-nowrap"
        >
          {isComplete
            ? <><Check size={12} weight="bold" className="inline" /> DONE!</>
            : isWalking
              ? '...'
              : <><Heart size={12} weight="fill" className="inline" /> SESSION {currentSession + 1}</>}
        </button>

        {/* Center: Player info + session + progress */}
        <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[7px] md:text-[8px] text-white uppercase truncate max-w-[60px] md:max-w-[100px]">{playerName}</span>
            <HeartMeter hearts={hearts} pulse={heartPulse} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-pixel text-[8px] text-[#80d8ff]">
              {currentSession}<span className="text-[#6b88ff]">/{TOTAL_SESSIONS}</span>
            </span>
            <div className="w-14 md:w-20 h-1.5 bg-[#333] rounded-sm overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-[#e09050] rounded-sm transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-pixel text-[7px] text-[#e09050]">{progress}%</span>
          </div>
        </div>

        {/* Right: Luigi Coach button */}
        <button
          onClick={onToggleChat}
          className={`relative py-1.5 px-2 md:px-3 ${
            chatOpen
              ? 'bg-[#a00000] border-t-[#600000] border-l-[#600000] border-b-[#ff6060] border-r-[#ff6060]'
              : 'bg-[#c82020] hover:bg-[#e03030] border-t-[#ff6060] border-l-[#ff6060] border-b-[#800000] border-r-[#800000]'
          } border-[3px] transition-all active:scale-95 shrink-0 flex flex-col items-center gap-0.5`}
          title="Talk to Coach Heartley"
        >
          <LuigiIcon size={24} />
          <span className="font-pixel text-[6px] md:text-[7px] text-white leading-none">COACH</span>
        </button>
      </div>

      {/* Goal bar + music toggle */}
      <div className="flex items-center justify-between px-3 py-1 bg-black/40 border-b border-[#a04000]/30">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-pixel text-[7px] text-[#80d8ff] shrink-0">GOAL</span>
          <p className="text-[9px] md:text-[10px] text-white/70 truncate max-w-[250px] md:max-w-[400px]">{goal}</p>
        </div>
        <button
          onClick={onToggleMusic}
          className={`shrink-0 ml-2 w-6 h-6 flex items-center justify-center rounded transition-colors ${
            musicPlaying
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-sky-700 hover:text-sky-500'
          }`}
          title={musicPlaying ? 'Mute music' : 'Play music'}
        >
          {musicPlaying ? <MusicNote size={14} weight="fill" /> : <MusicNoteSimple size={14} weight="regular" />}
        </button>
      </div>

      {/* Fitbit connected indicator (full insights panel is rendered separately) */}
      {gfitConnected && !healthTrends && (
        <div className="flex items-center justify-center gap-2 px-3 py-1 bg-black/60 border-b-2 border-[#a04000]/30">
          <span className="w-1.5 h-1.5 bg-[#80d010] rounded-full animate-pulse" />
          <span className="font-pixel text-[7px] text-[#80d8ff]">FITBIT</span>
          <span className="font-pixel text-[7px] text-[#fcd890] animate-pulse">LOADING...</span>
        </div>
      )}

      {!gfitConnected && (
        <button
          onClick={onConnectClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-1 bg-black/40 border-b-2 border-[#a04000]/20 hover:bg-[#a04000]/10 transition-colors cursor-pointer"
        >
          <Watch size={14} weight="fill" className="text-[#6b88ff]" />
          <span className="font-pixel text-[8px] text-[#6b88ff] hover:text-[#fcd890] transition-colors">
            CONNECT FITBIT
          </span>
        </button>
      )}

      {/* Buddy tracker */}
      {buddies.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-1 bg-indigo-950/40 border-b border-indigo-700/20">
          <span className="flex items-center gap-1 shrink-0">
            <Users size={12} weight="fill" className="text-indigo-400" />
            <span className="font-pixel text-[7px] text-indigo-400">COMPANIONS</span>
          </span>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {buddies.map((b) => (
              <span key={b.id} className="flex items-center gap-1 shrink-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-[10px] text-white/70 whitespace-nowrap">
                  {b.name.split(' ')[0]}
                </span>
                <span className="font-pixel text-[8px] text-indigo-300">
                  {b.session}/{TOTAL_SESSIONS}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
