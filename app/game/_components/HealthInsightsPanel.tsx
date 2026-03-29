'use client'

import type { HealthTrends } from '../../lib/fitbit'

interface HealthInsightsPanelProps {
  trends: HealthTrends
  currentSession: number
  hideMilestone?: boolean
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
  if (t.current.sleepMinutes != null) {
    if (t.current.sleepMinutes >= 420) out.push(`${Math.floor(t.current.sleepMinutes / 60)}h sleep — great for recovery.`)
    else if (t.current.sleepMinutes < 360 && t.current.sleepMinutes > 0) out.push(`Only ${Math.floor(t.current.sleepMinutes / 60)}h sleep. Heart heals best with 7+.`)
  }
  return out
}

function getMilestoneSummary(t: HealthTrends, session: number): { summary: string; appreciation: string } | null {
  if (session === 0 || session % 3 !== 0) return null

  const parts: string[] = []
  if (t.current.restingHR != null) parts.push(`HR ${t.current.restingHR}bpm`)
  if (t.current.avgDailySteps != null) parts.push(`${t.current.avgDailySteps.toLocaleString()} steps/day`)
  if (t.current.activeMinutes != null) parts.push(`${t.current.activeMinutes}m active`)
  if (t.totals.totalSteps != null) parts.push(`${(t.totals.totalSteps / 1000).toFixed(0)}k total`)

  const summary = parts.length > 0 ? `Session ${session}. ${parts.join(' · ')}` : `Session ${session} complete.`
  const progress = Math.round((session / 36) * 100)

  const appParts: string[] = []
  if (t.deltas.restingHR != null && t.deltas.restingHR < 0) appParts.push(`HR down ${Math.abs(t.deltas.restingHR)} BPM since start`)
  if (t.deltas.dailySteps != null && t.deltas.dailySteps > 0) appParts.push(`+${t.deltas.dailySteps.toLocaleString()} steps/day vs week 1`)
  if (t.totals.totalSteps != null && t.totals.totalSteps > 0) appParts.push(`${t.totals.totalSteps.toLocaleString()} total steps`)

  return { summary, appreciation: appParts.length > 0 ? `${progress}% done. ${appParts[0]}.` : `${progress}% complete.` }
}

function StatBox({ label, value, delta, good }: {
  label: string; value: string; delta?: string; good?: boolean | null
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[65px]">
      <span className="font-pixel text-[6px] text-[#80d8ff] uppercase">{label}</span>
      <span className="font-pixel text-sm text-white">{value}</span>
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
  const arrow = val > 0 ? '↑' : '↓'
  return { text: `${arrow}${Math.abs(val)}${unit}`, good }
}

export default function HealthInsightsPanel({ trends, currentSession, hideMilestone }: HealthInsightsPanelProps) {
  const insights = getInsights(trends)
  const milestone = hideMilestone ? null : getMilestoneSummary(trends, currentSession)
  const benefits = computeBenefits(trends)

  const hrDelta = formatDelta(trends.deltas.restingHR, '', true)
  const stepsDelta = formatDelta(trends.deltas.dailySteps, '/d')
  const activeDelta = formatDelta(trends.deltas.activeMinutes, 'm')

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

      {/* Stats row */}
      <div className="flex items-center justify-around px-2 py-2 gap-1 overflow-x-auto no-scrollbar border-b-2 border-[#a04000]/20">
        {trends.current.restingHR != null && (
          <StatBox label="HR" value={`${trends.current.restingHR}`}
            delta={hrDelta?.text} good={hrDelta?.good} />
        )}
        {trends.current.stepsToday != null && (
          <StatBox label="Steps" value={trends.current.stepsToday.toLocaleString()}
            delta={stepsDelta?.text} good={stepsDelta?.good} />
        )}
        {trends.current.activeMinutes != null && (
          <StatBox label="Active" value={`${trends.current.activeMinutes}m`}
            delta={activeDelta?.text} good={activeDelta?.good} />
        )}
        {trends.current.sleepMinutes != null && (
          <StatBox label="Sleep" value={`${Math.floor(trends.current.sleepMinutes / 60)}h${trends.current.sleepMinutes % 60}m`} />
        )}
        {trends.totals.totalSteps != null && trends.totals.totalSteps > 0 && (
          <StatBox label="Total" value={`${(trends.totals.totalSteps / 1000).toFixed(0)}k`}
            delta={`${trends.totals.programDays || 0}d`} good={null} />
        )}
      </div>

      {/* Health benefits row */}
      {benefits.length > 0 && (
        <div className="px-2 py-1.5 border-b-2 border-[#a04000]/20">
          <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-0 min-w-[60px]">
                <span className="font-pixel text-[5px] text-[#6b88ff] uppercase">{b.label}</span>
                <span className="font-pixel text-[9px] text-[#80d010]">{b.value}</span>
                <span className="text-[7px] text-[#a0501c]">{b.detail}</span>
              </div>
            ))}
          </div>
          <p className="text-center font-pixel text-[5px] text-[#a0501c]/60 mt-0.5">AHA / JAMA / PLOS RESEARCH</p>
        </div>
      )}

      {/* Baseline comparison */}
      {(trends.baseline.avgRestingHR != null || trends.baseline.avgDailySteps != null) && (
        <div className="flex items-center justify-center gap-3 px-3 py-1.5 text-[8px]">
          <span className="font-pixel text-[6px] text-[#6b88ff]">WEEK 1→NOW</span>
          {trends.baseline.avgRestingHR != null && trends.current.restingHR != null && (
            <span className="text-[#a0501c]">HR: {trends.baseline.avgRestingHR}→<span className="text-white">{trends.current.restingHR}</span></span>
          )}
          {trends.baseline.avgDailySteps != null && trends.current.avgDailySteps != null && (
            <span className="text-[#a0501c]">Steps: {trends.baseline.avgDailySteps.toLocaleString()}→<span className="text-white">{trends.current.avgDailySteps.toLocaleString()}</span></span>
          )}
          {trends.baseline.avgActiveMinutes != null && trends.current.activeMinutes != null && (
            <span className="text-[#a0501c]">Active: {trends.baseline.avgActiveMinutes}m→<span className="text-white">{trends.current.activeMinutes}m</span></span>
          )}
        </div>
      )}
    </div>
  )
}
