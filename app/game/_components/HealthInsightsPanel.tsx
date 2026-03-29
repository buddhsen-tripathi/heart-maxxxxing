'use client'

import { useState, useCallback } from 'react'
import type { HealthTrends } from '../../lib/fitbit'

interface HealthInsightsPanelProps {
  trends: HealthTrends
  currentSession: number
  hideMilestone?: boolean
  playerName?: string
  goal?: string
  language?: string
}

// ── Research-backed health benefit estimates ──

function computeBenefits(t: HealthTrends) {
  const benefits: Array<{ label: string; value: string; detail: string }> = []

  if (t.deltas.restingHR != null && t.deltas.restingHR < 0) {
    const bpmDrop = Math.abs(t.deltas.restingHR)
    benefits.push({ label: 'CV Risk', value: `↓~${Math.round(bpmDrop * 1.8)}%`, detail: `${bpmDrop} BPM lower HR` })
  }
  if (t.deltas.dailySteps != null && t.deltas.dailySteps > 0) {
    const reduction = Math.round((t.deltas.dailySteps / 1000) * 8)
    if (reduction > 0) benefits.push({ label: 'Mortality', value: `↓~${reduction}%`, detail: `+${t.deltas.dailySteps.toLocaleString()} steps/day` })
  }
  if (t.totals.totalActiveMinutes != null && t.totals.programDays != null && t.totals.programDays > 0) {
    const weeklyEst = Math.round((t.totals.totalActiveMinutes / t.totals.programDays) * 7)
    if (weeklyEst >= 150) benefits.push({ label: 'Life Gain', value: '+3.4 yrs', detail: `~${weeklyEst} min/wk` })
    else if (weeklyEst >= 75) benefits.push({ label: 'Life Gain', value: '+1.8 yrs', detail: `~${weeklyEst} min/wk` })
    else if (weeklyEst >= 30) benefits.push({ label: 'Life Gain', value: '+0.9 yrs', detail: `~${weeklyEst} min/wk` })
  }
  if (t.totals.totalSteps != null && t.totals.totalSteps > 0) {
    const km = t.totals.totalSteps * 0.0008
    if (km >= 1) benefits.push({ label: 'Distance', value: `${km.toFixed(0)} km`, detail: `${t.totals.totalSteps.toLocaleString()} steps` })
  }
  if (t.totals.programDays != null && t.totals.programDays > 0) {
    const pct = Math.min(100, Math.round((t.totals.programDays / 84) * 100))
    const reduction = Math.round(43 * (pct / 100))
    if (reduction > 0) benefits.push({ label: 'Readmit', value: `↓~${reduction}%`, detail: `${pct}% done` })
  }
  return benefits
}

function getInsights(t: HealthTrends): string[] {
  const out: string[] = []

  if (t.deltas.restingHR != null) {
    if (t.deltas.restingHR < -3) out.push(`Resting HR down ${Math.abs(t.deltas.restingHR)} BPM — heart is getting stronger.`)
    else if (t.deltas.restingHR < 0) out.push(`Resting HR improved by ${Math.abs(t.deltas.restingHR)} BPM. Steady progress.`)
    else if (t.deltas.restingHR > 3) out.push(`HR is up ${t.deltas.restingHR} BPM. Stress and sleep matter — you'll bounce back.`)
  }
  if (t.deltas.dailySteps != null) {
    if (t.deltas.dailySteps > 1000) out.push(`${t.deltas.dailySteps.toLocaleString()} more steps/day than week 1.`)
    else if (t.deltas.dailySteps > 0) out.push(`Steps trending up by ${t.deltas.dailySteps.toLocaleString()}/day.`)
    else if (t.deltas.dailySteps < -500) out.push(`Steps are down from baseline. Even a short walk counts.`)
  }
  if (t.deltas.activeMinutes != null) {
    if (t.deltas.activeMinutes > 10) out.push(`${t.deltas.activeMinutes} more active minutes/day — endurance is growing.`)
    else if (t.deltas.activeMinutes < -10) out.push(`Active time dipped. A 10-minute walk turns this around.`)
  }

  // HRV insight
  if (t.deltas.hrv != null) {
    if (t.deltas.hrv > 5) out.push(`HRV up ${t.deltas.hrv}ms — your nervous system is recovering well.`)
    else if (t.deltas.hrv < -5) out.push(`HRV dipped ${Math.abs(t.deltas.hrv)}ms. Rest and hydration help it bounce back.`)
  }

  // HR zones insight
  if (t.current.hrZones) {
    const cardio = t.current.hrZones.cardio + t.current.hrZones.peak
    if (cardio >= 20) out.push(`${cardio}m in cardio/peak zone today — strong rehab intensity.`)
    else if (cardio > 0) out.push(`${cardio}m in cardio zone. Aim for 20+ min for best cardiac benefit.`)
  }

  // Sleep stages insight
  if (t.current.sleepStages) {
    const { deep, rem, wake } = t.current.sleepStages
    if (deep < 45 && deep > 0) out.push(`Only ${deep}m deep sleep. Cooler room and consistent bedtime help.`)
    else if (deep >= 90) out.push(`${deep}m deep sleep — excellent recovery.`)
    if (wake > 30) out.push(`${wake}m awake during sleep. Stress or caffeine might be the cause.`)
    if (rem >= 60) out.push(`${rem}m REM sleep — great for mental recovery.`)
  } else if (t.current.sleepMinutes != null) {
    if (t.current.sleepMinutes >= 420) out.push(`${Math.floor(t.current.sleepMinutes / 60)}h sleep — great for recovery.`)
    else if (t.current.sleepMinutes < 360 && t.current.sleepMinutes > 0) out.push(`Only ${Math.floor(t.current.sleepMinutes / 60)}h sleep. Heart heals best with 7+.`)
  }

  return out
}

function getMilestoneSummary(t: HealthTrends, session: number): { summary: string; appreciation: string } | null {
  if (session === 0 || session % 3 !== 0) return null

  const parts: string[] = []
  if (t.current.restingHR != null) parts.push(`HR ${t.current.restingHR}bpm`)
  if (t.current.hrv != null) parts.push(`HRV ${t.current.hrv}ms`)
  if (t.current.avgDailySteps != null) parts.push(`${t.current.avgDailySteps.toLocaleString()} steps/day`)
  if (t.current.activeMinutes != null) parts.push(`${t.current.activeMinutes}m active`)
  if (t.totals.totalCardioMinutes != null) parts.push(`${t.totals.totalCardioMinutes}m cardio total`)

  const summary = parts.length > 0 ? `Session ${session}. ${parts.join(' · ')}` : `Session ${session} complete.`
  const progress = Math.round((session / 36) * 100)

  const appParts: string[] = []
  if (t.deltas.restingHR != null && t.deltas.restingHR < 0) appParts.push(`HR down ${Math.abs(t.deltas.restingHR)} BPM since start`)
  if (t.deltas.hrv != null && t.deltas.hrv > 0) appParts.push(`HRV up ${t.deltas.hrv}ms — stronger recovery`)
  if (t.deltas.dailySteps != null && t.deltas.dailySteps > 0) appParts.push(`+${t.deltas.dailySteps.toLocaleString()} steps/day vs week 1`)

  return { summary, appreciation: appParts.length > 0 ? `${progress}% done. ${appParts[0]}.` : `${progress}% complete.` }
}

function StatBox({ label, value, delta, good }: {
  label: string; value: string; delta?: string; good?: boolean | null
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[55px]">
      <span className="font-pixel text-[6px] text-[#80d8ff] uppercase">{label}</span>
      <span className="font-pixel text-xs text-white">{value}</span>
      {delta && (
        <span className={`font-pixel text-[7px] ${good === true ? 'text-[#80d010]' : good === false ? 'text-[#e02020]' : 'text-[#fcd890]'}`}>
          {delta}
        </span>
      )}
    </div>
  )
}

function formatDelta(val?: number, unit = '', invert = false): { text: string; good: boolean } | null {
  if (val == null || val === 0) return null
  const good = invert ? val < 0 : val > 0
  return { text: `${val > 0 ? '↑' : '↓'}${Math.abs(val)}${unit}`, good }
}

export default function HealthInsightsPanel({
  trends, currentSession, hideMilestone,
  playerName, goal, language,
}: HealthInsightsPanelProps) {
  const [report, setReport] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const insights = getInsights(trends)
  const milestone = hideMilestone ? null : getMilestoneSummary(trends, currentSession)
  const benefits = computeBenefits(trends)

  const hrDelta = formatDelta(trends.deltas.restingHR, '', true)
  const stepsDelta = formatDelta(trends.deltas.dailySteps, '/d')
  const activeDelta = formatDelta(trends.deltas.activeMinutes, 'm')
  const hrvDelta = formatDelta(trends.deltas.hrv, 'ms')

  const fetchReport = useCallback(async () => {
    if (report) { setShowReport(true); return }
    setReportLoading(true)
    setShowReport(true)
    try {
      const res = await fetch('/api/health-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trends,
          session: currentSession,
          playerName: playerName || 'Friend',
          goal: goal || 'Complete cardiac rehab',
          language,
        }),
      })
      if (res.ok) {
        const { report: text } = await res.json()
        setReport(text)
      }
    } catch { /* silent */ }
    finally { setReportLoading(false) }
  }, [report, trends, currentSession, playerName, goal, language])

  return (
    <div className="bg-black/80 border-b-4 border-[#a04000]">
      {/* Milestone banner */}
      {milestone && (
        <div className="px-3 py-2 border-b-2 border-[#fcd890]/30 bg-[#a04000]/20">
          <p className="font-pixel text-[8px] text-[#fcd890] leading-relaxed">{milestone.summary}</p>
          <p className="font-pixel text-[7px] text-[#80d010] leading-relaxed mt-1">{milestone.appreciation}</p>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="px-3 py-2 border-b-2 border-[#a04000]/20">
          {insights.map((text, i) => (
            <p key={i} className="text-[10px] text-[#fcd890]/90 leading-relaxed">{text}</p>
          ))}
        </div>
      )}

      {/* Stats row — core vitals */}
      <div className="flex items-center justify-around px-1 py-2 gap-0.5 overflow-x-auto no-scrollbar border-b-2 border-[#a04000]/20">
        {trends.current.restingHR != null && (
          <StatBox label="HR" value={`${trends.current.restingHR}`} delta={hrDelta?.text} good={hrDelta?.good} />
        )}
        {trends.current.hrv != null && (
          <StatBox label="HRV" value={`${trends.current.hrv}`} delta={hrvDelta?.text} good={hrvDelta?.good} />
        )}
        {trends.current.stepsToday != null && (
          <StatBox label="Steps" value={trends.current.stepsToday.toLocaleString()} delta={stepsDelta?.text} good={stepsDelta?.good} />
        )}
        {trends.current.activeMinutes != null && (
          <StatBox label="Active" value={`${trends.current.activeMinutes}m`} delta={activeDelta?.text} good={activeDelta?.good} />
        )}
        {trends.current.hrZones && (
          <StatBox label="Cardio" value={`${trends.current.hrZones.cardio + trends.current.hrZones.peak}m`} />
        )}
        {trends.current.sleepStages ? (
          <StatBox label="Deep" value={`${trends.current.sleepStages.deep}m`} />
        ) : trends.current.sleepMinutes != null ? (
          <StatBox label="Sleep" value={`${Math.floor(trends.current.sleepMinutes / 60)}h${trends.current.sleepMinutes % 60}m`} />
        ) : null}
      </div>

      {/* HR zones bar (if available) */}
      {trends.current.hrZones && (
        <div className="px-3 py-1.5 border-b-2 border-[#a04000]/20">
          <div className="flex items-center gap-1">
            <span className="font-pixel text-[5px] text-[#80d8ff] w-10 shrink-0">ZONES</span>
            <div className="flex-1 flex h-3 rounded-sm overflow-hidden">
              {[
                { min: trends.current.hrZones.outOfRange, color: 'bg-[#6b88ff]' },
                { min: trends.current.hrZones.fatBurn, color: 'bg-[#fcd890]' },
                { min: trends.current.hrZones.cardio, color: 'bg-[#e09050]' },
                { min: trends.current.hrZones.peak, color: 'bg-[#e02020]' },
              ].map((z, i) => {
                const total = trends.current.hrZones!.outOfRange + trends.current.hrZones!.fatBurn + trends.current.hrZones!.cardio + trends.current.hrZones!.peak
                const pct = total > 0 ? (z.min / total) * 100 : 0
                return pct > 0 ? <div key={i} className={`${z.color} h-full`} style={{ width: `${pct}%` }} /> : null
              })}
            </div>
          </div>
          <div className="flex justify-between mt-0.5 text-[6px]">
            <span className="text-[#6b88ff]">Rest {trends.current.hrZones.outOfRange}m</span>
            <span className="text-[#fcd890]">Burn {trends.current.hrZones.fatBurn}m</span>
            <span className="text-[#e09050]">Cardio {trends.current.hrZones.cardio}m</span>
            <span className="text-[#e02020]">Peak {trends.current.hrZones.peak}m</span>
          </div>
        </div>
      )}

      {/* Sleep stages bar (if available) */}
      {trends.current.sleepStages && (
        <div className="px-3 py-1.5 border-b-2 border-[#a04000]/20">
          <div className="flex items-center gap-1">
            <span className="font-pixel text-[5px] text-[#80d8ff] w-10 shrink-0">SLEEP</span>
            <div className="flex-1 flex h-3 rounded-sm overflow-hidden">
              {[
                { min: trends.current.sleepStages.deep, color: 'bg-indigo-700' },
                { min: trends.current.sleepStages.light, color: 'bg-indigo-400' },
                { min: trends.current.sleepStages.rem, color: 'bg-purple-500' },
                { min: trends.current.sleepStages.wake, color: 'bg-[#a0501c]' },
              ].map((s, i) => {
                const total = trends.current.sleepMinutes || 1
                const pct = (s.min / total) * 100
                return pct > 0 ? <div key={i} className={`${s.color} h-full`} style={{ width: `${pct}%` }} /> : null
              })}
            </div>
          </div>
          <div className="flex justify-between mt-0.5 text-[6px]">
            <span className="text-indigo-400">Deep {trends.current.sleepStages.deep}m</span>
            <span className="text-indigo-300">Light {trends.current.sleepStages.light}m</span>
            <span className="text-purple-400">REM {trends.current.sleepStages.rem}m</span>
            <span className="text-[#a0501c]">Wake {trends.current.sleepStages.wake}m</span>
          </div>
        </div>
      )}

      {/* Totals + benefits */}
      {benefits.length > 0 && (
        <div className="px-2 py-1.5 border-b-2 border-[#a04000]/20">
          <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-0 min-w-[55px]">
                <span className="font-pixel text-[5px] text-[#6b88ff] uppercase">{b.label}</span>
                <span className="font-pixel text-[9px] text-[#80d010]">{b.value}</span>
                <span className="text-[6px] text-[#a0501c]">{b.detail}</span>
              </div>
            ))}
          </div>
          <p className="text-center font-pixel text-[5px] text-[#a0501c]/60 mt-0.5">AHA / JAMA / PLOS RESEARCH</p>
        </div>
      )}

      {/* Baseline comparison */}
      {(trends.baseline.avgRestingHR != null || trends.baseline.avgDailySteps != null) && (
        <div className="flex items-center justify-center gap-3 px-3 py-1 text-[8px] border-b-2 border-[#a04000]/20">
          <span className="font-pixel text-[6px] text-[#6b88ff]">WK1→NOW</span>
          {trends.baseline.avgRestingHR != null && trends.current.restingHR != null && (
            <span className="text-[#a0501c]">HR: {trends.baseline.avgRestingHR}→<span className="text-white">{trends.current.restingHR}</span></span>
          )}
          {trends.baseline.avgHRV != null && trends.current.hrv != null && (
            <span className="text-[#a0501c]">HRV: {trends.baseline.avgHRV}→<span className="text-white">{trends.current.hrv}</span></span>
          )}
          {trends.baseline.avgDailySteps != null && trends.current.avgDailySteps != null && (
            <span className="text-[#a0501c]">Steps: {trends.baseline.avgDailySteps.toLocaleString()}→<span className="text-white">{trends.current.avgDailySteps.toLocaleString()}</span></span>
          )}
        </div>
      )}

      {/* Weekly Health Report button + content */}
      <div className="px-3 py-1.5">
        <button
          onClick={fetchReport}
          disabled={reportLoading}
          className="w-full py-1.5 font-pixel text-[7px] text-[#6b88ff] hover:text-[#fcd890] border border-[#a04000]/30 hover:border-[#fcd890]/40 rounded-sm transition-colors disabled:opacity-50"
        >
          {reportLoading ? 'GENERATING...' : showReport && report ? 'HIDE REPORT' : 'WEEKLY HEALTH REPORT'}
        </button>

        {showReport && report && (
          <div className="mt-2 p-3 bg-[#a04000]/10 border border-[#a04000]/20 rounded-sm">
            {report.split('\n').map((line, i) => {
              const isHeader = /^(HEART|ACTIVITY|RECOVERY|OUTLOOK)/i.test(line.trim())
              return line.trim() ? (
                <p key={i} className={isHeader
                  ? 'font-pixel text-[7px] text-[#80d8ff] uppercase mt-2 mb-1 first:mt-0'
                  : 'text-[10px] text-[#fcd890]/80 leading-relaxed'
                }>
                  {line}
                </p>
              ) : null
            })}
          </div>
        )}

        {showReport && report && (
          <button
            onClick={() => { setShowReport(false) }}
            className="w-full mt-1 py-1 font-pixel text-[6px] text-[#a0501c] hover:text-[#fcd890] transition-colors"
          >
            CLOSE
          </button>
        )}
      </div>
    </div>
  )
}
