import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { type PowerupType } from '../../lib/powerups'

export const maxDuration = 15

const TYPE_PROMPTS: Record<PowerupType, string> = {
  'goal-progress': `Write a short, motivating message (2-3 sentences) about how the patient is getting closer to their personal goal.
Be SPECIFIC to their goal — if they want to run a marathon, talk about miles and endurance. If they want to walk without stopping, talk about stamina building.
Include a concrete, believable metric tied to their progress percentage (e.g. "You could probably do X by now").
Tone: excited, personal, like a coach who knows them.`,

  'health-tip': `Share one specific, practical cardiac rehab health tip (2-3 sentences).
Tailor it to their stage in rehab (early = reassurance about safety, mid = building confidence, late = maintaining habits).
Make it feel fresh and relevant to their personal goal when possible.
Tone: knowledgeable but warm, like a nurse friend.`,

  'loved-one': `Write a short heartfelt message (2-3 sentences) from a loved one (daughter named Ana) to the patient.
Reference their specific goal and progress. Make it feel genuine and personal, not generic.
The daughter knows about the game and is watching the patient's Mario character advance.
Tone: loving, proud, slightly emotional.`,

  'achievement': `Create a fun achievement/badge name and a short description (2-3 sentences) celebrating the patient's milestone.
Reference their session count and make the achievement name creative and goal-specific.
Include a fun stat comparison (e.g. "top X% of patients" or "equivalent to Y").
Tone: celebratory, game-like, makes them feel legendary.`,

  'heart-fact': `Share one fascinating cardiac health fact (2-3 sentences) relevant to where the patient is in their rehab journey.
Connect it to a real physiological improvement that's likely happening in their body right now.
If possible, relate it to their personal goal.
Tone: "wow, that's cool" — educational but exciting.`,

  'celebration': `Write a triumphant celebration message (3-4 sentences) for completing all 36 cardiac rehab sessions.
Reference their specific goal and how they've achieved it. Include the 43% risk reduction stat.
Make them feel like a true hero. Reference the Mario game journey.
Tone: emotional, proud, victorious.`,
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
    system: `You are a creative writer for a cardiac rehabilitation gamification app styled like Super Mario Bros.
You write short, personalized reward messages that appear when a patient hits a ? block in the game.
Keep messages concise — max 3 sentences. No markdown formatting. Use plain text only.
Be warm, specific, and encouraging. Never use medical jargon.
When real health data is provided, ALWAYS reference specific numbers and improvements — this is what makes the message powerful.`,
    prompt: `Patient: ${playerName}${patientProfile ? ` (${patientProfile.age}yo ${patientProfile.gender}, BP ${patientProfile.bloodPressure}, resting HR ${patientProfile.restingHeartRate} BPM, conditions: ${patientProfile.pastDiseases.join(', ') || 'none'})` : ''}
Personal Goal: "${goal}"
Sessions completed: ${session} of 36 (${progress}% done)${patientProfile?.rehabPhase ? `\nCurrent rehab phase: ${patientProfile.rehabPhase}` : ''}
Reward type: ${type}

${typePrompt}${healthPrompt}`,
  })

  return Response.json({ content: text })
}
