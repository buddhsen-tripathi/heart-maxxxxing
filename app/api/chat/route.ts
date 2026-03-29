import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { buildCoachPrompt } from '../../lib/coach-prompt'
import type { GameState } from '../../lib/game-state'
import type { HealthTrends } from '../../lib/fitbit'

export const maxDuration = 30

export async function POST(req: Request) {
  const {
    messages,
    gameState,
    healthTrends,
  }: {
    messages: UIMessage[]
    gameState: GameState
    healthTrends?: HealthTrends | null
  } = await req.json()

  const system = buildCoachPrompt(gameState, healthTrends ?? undefined)

  const result = streamText({
    model: google('	gemini-3.1-flash-lite-preview'),
    system,
    messages: await convertToModelMessages(messages),
    temperature: 0.85,
    maxOutputTokens: 300,
  })

  return result.toUIMessageStreamResponse()
}
