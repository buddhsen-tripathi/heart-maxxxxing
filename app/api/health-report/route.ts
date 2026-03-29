import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import type { HealthTrends } from '../../lib/fitbit'

export const maxDuration = 20

export async function POST(req: Request) {
  const {
    trends,
    session,
    playerName,
    goal,
    language,
  }: {
    trends: HealthTrends
    session: number
    playerName: string
    goal: string
    language?: string
  } = await req.json()

  const dataLines: string[] = []

  // Core vitals
  if (trends.current.restingHR != null)
    dataLines.push(`Resting Heart Rate: ${trends.current.restingHR} BPM`)
  if (trends.deltas.restingHR != null)
    dataLines.push(`HR change since start: ${trends.deltas.restingHR > 0 ? '+' : ''}${trends.deltas.restingHR} BPM`)
  if (trends.baseline.avgRestingHR != null)
    dataLines.push(`Week 1 avg HR: ${trends.baseline.avgRestingHR} BPM`)

  // HRV
  if (trends.current.hrv != null)
    dataLines.push(`Current HRV (RMSSD): ${trends.current.hrv} ms`)
  if (trends.deltas.hrv != null)
    dataLines.push(`HRV change since start: ${trends.deltas.hrv > 0 ? '+' : ''}${trends.deltas.hrv} ms`)
  if (trends.baseline.avgHRV != null)
    dataLines.push(`Week 1 avg HRV: ${trends.baseline.avgHRV} ms`)

  // HR Zones
  if (trends.current.hrZones) {
    const z = trends.current.hrZones
    dataLines.push(`HR Zones today: Out of Range ${z.outOfRange}m, Fat Burn ${z.fatBurn}m, Cardio ${z.cardio}m, Peak ${z.peak}m`)
  }
  if (trends.totals.totalCardioMinutes != null)
    dataLines.push(`Total Cardio+Peak minutes across program: ${trends.totals.totalCardioMinutes}m`)

  // Steps
  if (trends.current.stepsToday != null)
    dataLines.push(`Steps today: ${trends.current.stepsToday.toLocaleString()}`)
  if (trends.current.avgDailySteps != null)
    dataLines.push(`Current avg daily steps: ${trends.current.avgDailySteps.toLocaleString()}`)
  if (trends.deltas.dailySteps != null)
    dataLines.push(`Steps change vs baseline: ${trends.deltas.dailySteps > 0 ? '+' : ''}${trends.deltas.dailySteps.toLocaleString()}/day`)
  if (trends.totals.totalSteps != null)
    dataLines.push(`Total steps in program: ${trends.totals.totalSteps.toLocaleString()}`)

  // Activity
  if (trends.current.activeMinutes != null)
    dataLines.push(`Active minutes today: ${trends.current.activeMinutes}`)
  if (trends.deltas.activeMinutes != null)
    dataLines.push(`Active minutes change: ${trends.deltas.activeMinutes > 0 ? '+' : ''}${trends.deltas.activeMinutes}/day`)
  if (trends.totals.totalActiveMinutes != null)
    dataLines.push(`Total active minutes: ${trends.totals.totalActiveMinutes}`)

  // Sleep
  if (trends.current.sleepMinutes != null)
    dataLines.push(`Sleep last night: ${Math.floor(trends.current.sleepMinutes / 60)}h ${trends.current.sleepMinutes % 60}m`)
  if (trends.current.sleepStages) {
    const s = trends.current.sleepStages
    dataLines.push(`Sleep stages: Deep ${s.deep}m, Light ${s.light}m, REM ${s.rem}m, Awake ${s.wake}m`)
  }

  // Program
  if (trends.totals.programDays != null)
    dataLines.push(`Days in program: ${trends.totals.programDays}`)

  const progress = Math.round((session / 36) * 100)
  const langInstruction = language && language !== 'en'
    ? `IMPORTANT: Write the entire report in ${language}. Use culturally natural expressions, not stiff translations.`
    : ''

  const { text } = await generateText({
    model: google('gemini-2.5-flash-preview-05-20'),
    system: `You are a cardiac rehab health analyst. You write personalized weekly health reports based on real Fitbit data.

RULES:
- Write in 4 short sections with headers: HEART, ACTIVITY, RECOVERY, OUTLOOK
- Each section: 2-3 sentences max. Be specific with numbers.
- Interpret the data — don't just repeat it. Tell them what it MEANS for their heart.
- For HRV: higher = better recovery. Explain in plain language ("your nervous system is recovering well").
- For HR zones: more time in cardio zone = stronger rehab sessions. Compare to recommended targets.
- For sleep stages: flag low deep sleep (<60min) or high wake time (>30min). Tie to recovery.
- For steps/activity deltas: frame improvements as tangible health gains, not just "good job".
- If something is concerning (HR up, HRV down, sleep poor), say it directly but with next-step advice.
- End OUTLOOK with one specific, actionable thing they can do this week.
- No medical jargon. No bullet points. Write like a knowledgeable friend.
${langInstruction}`,
    prompt: `Patient: ${playerName}
Goal: "${goal}"
Session: ${session}/36 (${progress}%)

FITBIT DATA:
${dataLines.join('\n')}`,
    temperature: 0.7,
    maxOutputTokens: 600,
  })

  return Response.json({ report: text })
}
