import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { type PowerupType } from '../../lib/powerups'

export const maxDuration = 15

const TYPE_PROMPTS: Record<PowerupType, string> = {
  'goal-progress': `One punchy sentence about a concrete milestone toward their goal. Be SPECIFIC to the goal.
Examples: "Your heart can sustain a 10K now — marathon training starts here." / "15 minutes used to be your wall. Now you don't even notice it."
Name what they can DO now, not a percentage.`,

  'health-tip': `One specific health fact tied to their goal AND their conditions. Not generic.
If they have hypertension, make it about blood pressure. If diabetes, make it about blood sugar.
Examples: "BP drops for 22 hours after cardio — your arteries are at their most relaxed right now." / "Your muscles just got better at pulling sugar from blood. Exercise is working like a second dose."
Make them think "I didn't know that about MY body."`,

  'loved-one': `Write a deeply personal message from someone who loves this patient. NOT about progress, stats, or sessions.

This is about the PERSON, not the program. Write what a daughter, son, or partner would actually text — something that makes them tear up because it's about THEM, not their heart rate.

Topics that work: a shared memory, missing them, something they said that stuck, fear of losing them, gratitude for who they are, a future moment they want together (a wedding, a grandchild, a trip), an inside joke, the way they laugh, how the house feels different since they got sick.

DO NOT mention: session numbers, progress percentages, the game, Mario, steps, heart rate, or any health metric. Zero.

End with " — " and a first name. Pick from: Ana, David, Paula, Marcus, Sofia, James.
One emoji max. 2-3 sentences. Write like it's a real text that makes you put your phone down and stare at the ceiling.

Examples:
"Remember when I was little and you'd carry me on your shoulders at the fair? I want my kids to know what that feels like. That's why this matters to me. — Ana"
"I still make your recipe wrong every time. I need you around to keep yelling at me about the garlic. — David"
"Mom, I'm getting married in October. I need you there. Not on a screen. There. — Sofia"`,

  'achievement': `Achievement name (2-3 words, ALL CAPS) + one sentence why it matters. Tie it to their goal.
If they have health data, reference a real number.
Examples: "MILE MAKER — Your heart didn't know this pace existed 12 sessions ago." / "STEADY PULSE — Your resting HR dropped 5 BPM. That's real."`,

  'heart-fact': `One mind-blowing fact about what's happening inside their body RIGHT NOW at this point in rehab. Connect it to something they can feel.
If they have specific conditions (hypertension, diabetes, AFib), make the fact relevant to THEIR condition.
Examples: "Your heart is growing new blood vessels around blockages — building its own bypass." / "Your vagus nerve is 20% more responsive. That's why you sleep better."`,

  'celebration': `Two sentences for completing all 36 sessions. Reference their specific goal, the 43% risk reduction, and who they are now vs session 1.
If they have health data, weave in one real improvement. Make it hit hard.`,
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
      ethnicity?: string
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
      healthPrompt = `\n\nREAL HEALTH DATA from their Fitbit (use a specific number to make the message personal!):\n${lines.join('\n')}`
    }
  }

  let profilePrompt = ''
  if (patientProfile) {
    const parts = [
      `${patientProfile.age}yo ${patientProfile.gender}`,
      `BP ${patientProfile.bloodPressure}`,
      `resting HR ${patientProfile.restingHeartRate} BPM`,
    ]
    if (patientProfile.pastDiseases.length > 0)
      parts.push(`conditions: ${patientProfile.pastDiseases.join(', ')}`)
    if (patientProfile.ethnicity)
      parts.push(`background: ${patientProfile.ethnicity}`)
    if (patientProfile.rehabPhase)
      parts.push(`phase: ${patientProfile.rehabPhase}`)
    profilePrompt = ` (${parts.join(', ')})`
  }

  // For loved-one messages: strip health data and stats — it should be purely emotional
  const isLovedOne = type === 'loved-one'

  const { text } = await generateText({
    model: google('gemini-3.1-flash-lite-preview'),
    system: isLovedOne
      ? `You write messages from a loved one to a cardiac rehab patient. This is NOT a game reward — it's a real, deeply personal message.

RULES:
- 2-3 sentences. Plain text, no markdown.
- Write from the heart of someone who loves this person. A daughter, son, partner.
- DO NOT reference stats, progress, sessions, the game, health metrics, or anything clinical.
- This is about the PERSON — who they are, shared memories, future moments, fear of loss, gratitude.
- Make it specific enough to feel real. Generic warmth is worse than nothing.
- One emoji max. End with " — FirstName".`
      : `You write SHORT reward messages for a cardiac rehab game. A patient hit a ? block and earned a reward.

RULES:
- MAX 1-2 sentences. Be punchy. Every word must earn its place.
- Plain text only, no markdown. No emojis EXCEPT for "loved-one" type (where one emoji is OK).
- Be personal — use their name, reference their specific goal and conditions. Generic = failure.
- If the patient has specific conditions (hypertension, diabetes, AFib, etc.), tailor the message to their condition.
- If health data is provided, weave in one specific real number naturally.
- Make them feel something real in as few words as possible.`,
    prompt: isLovedOne
      ? `Patient name: ${playerName}${profilePrompt ? ` ${profilePrompt}` : ''}
Personal Goal: "${goal}"

${typePrompt}`
      : `Patient: ${playerName}${profilePrompt}
Personal Goal: "${goal}"
Sessions completed: ${session} of 36 (${progress}% done)
Reward type: ${type}

${typePrompt}${healthPrompt}`,
    maxOutputTokens: isLovedOne ? 200 : 120,
  })

  return Response.json({ content: text })
}
