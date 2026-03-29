export interface GameState {
  playerName: string
  goal: string
  currentSession: number
  completedSessions: number[]
  lastSessionDate: string | null
  viewedPowerups: number[]
  startDate: string | null
}

const STORAGE_KEY = 'heart-maxxxxing-state'

export const DEFAULT_STATE: GameState = {
  playerName: '',
  goal: '',
  currentSession: 0,
  completedSessions: [],
  lastSessionDate: null,
  viewedPowerups: [],
  startDate: null,
}

export function saveState(state: GameState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadState(): GameState | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function getHearts(session: number): number {
  // Start with 0.5, gain 0.5 at every even session
  if (session === 0) return 0.5
  const evenCount = Math.floor(session / 2)
  return 0.5 + evenCount * 0.5
}

export function hasBrickAt(session: number): boolean {
  return session > 0 && session % 3 === 0
}

export function daysSinceLastSession(state: GameState): number {
  if (!state.lastSessionDate) return 0
  const last = new Date(state.lastSessionDate)
  const now = new Date()
  const diff = now.getTime() - last.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export const TOTAL_SESSIONS = 36
