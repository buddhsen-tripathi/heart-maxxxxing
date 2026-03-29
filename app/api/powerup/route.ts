import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { type PowerupType } from '../../lib/powerups'

export const maxDuration = 15

const TYPE_PROMPTS: Record<PowerupType, string> = {
  'goal-progress': `One punchy sentence about a concrete milestone toward their goal. Be SPECIFIC to the goal.
Examples: "Your heart can sustain a 10K now — marathon training starts here." / "15 minutes used to be your wall. Now you don't even notice it."
Name what they can DO now, not a percentage.`,

  'health-tip': `One specific health fact tied to their goal or conditions. Not generic advice.
Examples: "BP drops for 22 hours after cardio — your arteries are at their most relaxed right now." / "Your muscles just got better at pulling sugar from blood. Exercise is working like a second dose."
Make them think "I didn't know that about MY body."`,

  'loved-one': `Write in FIRST PERSON as a loved one. One warm, real sentence — like a text message.
Be specific to their progress. Can be funny, teasing, or tender. Not a greeting card.
End with " — " followed by a first name (rotate through: Ana, David, Paula, Marcus, Sofia, James). Pick one.
Examples: "I screenshot your Mario every time it moves. {session} sessions, seriously?! — Ana" / "Told my friends about you. You're famous now. — Paula"`,

  'achievement': `Achievement name (2-3 words, ALL CAPS) + one sentence why it matters. Tie it to their goal.
Examples: "MILE MAKER — Your heart didn't know this pace existed 12 sessions ago." / "PLAYGROUND READY — You can officially outrun a 5-year-old."`,

  'heart-fact': `One mind-blowing fact about what's happening inside their body RIGHT NOW. Connect it to something they can feel.
Examples: "Your heart is growing new blood vessels around blockages — building its own bypass." / "Your vagus nerve is 20% more responsive. That's why you sleep better."`,

  'celebration': `Two sentences for completing all 36 sessions. Reference their specific goal, the 43% risk reduction, and who they are now vs session 1. Make it hit hard.`,
}

interface HealthContext {
  restingHR?: number
  baselineHR?: number
  deltaHR?: number
  stepsToday?: number
  deltaSteps?: number
  totalSteps?: number
  activeMinutes?: number
  deltaActiveMinutes?: number
  totalDistance?: number
  programDays?: number
}

export async function POST(req: Request) {
  const { session, goal, playerName, type, progress, health, patientProfile } = (await req.json()) as {
    session: number
    goal: string
    playerName: string
    type: PowerupType
    progress: number
    health?: HealthContext
    patientProfile?: {
      age: number
      gender: string
      bloodPressure: string
      restingHeartRate: number
      pastDiseases: string[]
      rehabPhase?: string
    }
  }

  const typePrompt = TYPE_PROMPTS[type] || TYPE_PROMPTS['health-tip']

  let healthPrompt = ''
  if (health) {
    const lines: string[] = []
    if (health.restingHR) lines.push(`Current resting HR: ${health.restingHR} BPM`)
    if (health.deltaHR != null) lines.push(`HR change since start: ${health.deltaHR > 0 ? '+' : ''}${health.deltaHR} BPM (negative = improvement)`)
    if (health.stepsToday) lines.push(`Steps today: ${health.stepsToday.toLocaleString()}`)
    if (health.deltaSteps != null) lines.push(`Daily steps change since start: ${health.deltaSteps > 0 ? '+' : ''}${health.deltaSteps.toLocaleString()}`)
    if (health.totalSteps) lines.push(`Total steps in program: ${health.totalSteps.toLocaleString()}`)
    if (health.totalDistance) lines.push(`Total distance walked: ${(health.totalDistance / 1000).toFixed(1)} km`)
    if (health.activeMinutes) lines.push(`Active minutes today: ${health.activeMinutes}`)
    if (health.deltaActiveMinutes != null) lines.push(`Active minutes change since start: ${health.deltaActiveMinutes > 0 ? '+' : ''}${health.deltaActiveMinutes} min/day`)
    if (health.programDays) lines.push(`Days in program: ${health.programDays}`)

    if (lines.length > 0) {
      healthPrompt = `\n\nREAL HEALTH DATA from their Fitbit (use these specific numbers to make the message personal and data-driven!):\n${lines.join('\n')}`
    }
  }

  const { text } = await generateText({
    model: google('gemini-3.1-flash-lite-preview'),
    system: `You write SHORT reward messages for a cardiac rehab game. A patient hit a ? block.

RULES:
- MAX 1-2 sentences. Be punchy. Every word must earn its place.
- Plain text only, no markdown, no emojis.
- Be personal — use their name, reference their specific goal. Generic = failure.
- For "loved-one" type: write in FIRST PERSON as Ana (their daughter). Like a real text message.
- If health data is provided, weave in one specific number naturally.
- Make them feel something real in as few words as possible.`,
    prompt: `Patient: ${playerName}${patientProfile ? ` (${patientProfile.age}yo ${patientProfile.gender}, BP ${patientProfile.bloodPressure}, resting HR ${patientProfile.restingHeartRate} BPM, conditions: ${patientProfile.pastDiseases.join(', ') || 'none'})` : ''}
Personal Goal: "${goal}"
Sessions completed: ${session} of 36 (${progress}% done)${patientProfile?.rehabPhase ? `\nCurrent rehab phase: ${patientProfile.rehabPhase}` : ''}
Reward type: ${type}

${typePrompt}${healthPrompt}`,
    maxOutputTokens: 100,
  })

  return Response.json({ content: text })
}
