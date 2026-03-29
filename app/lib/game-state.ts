export interface RehabAct {
  id: string
  title: string
  missionsCount: number
  description: string
}

export interface RehabPlan {
  title: string
  acts: RehabAct[]
  totalSessions: number
  totalWeeks: number
}

export interface PatientProfile {
  age: number
  gender: string
  height: number
  bloodPressure: string
  restingHeartRate: number
  pastDiseases: string[]
  rehabPlan: RehabPlan
}

export interface GameState {
  playerName: string
  goal: string
  currentSession: number
  completedSessions: number[]
  lastSessionDate: string | null
  viewedPowerups: number[]
  startDate: string | null
  profile: PatientProfile
}

const STORAGE_KEY = 'heart-maxxxxing-state'

export const DEFAULT_PROFILE: PatientProfile = {
  age: 58,
  gender: 'male',
  height: 178,
  bloodPressure: '145/92',
  restingHeartRate: 78,
  pastDiseases: ['hypertension', 'type 2 diabetes'],
  rehabPlan: {
    title: 'Heart Recovery Path',
    acts: [
      { id: 'act1', title: 'Phase I: Initial Progress', missionsCount: 6, description: 'Establishing your baseline.' },
      { id: 'act2', title: 'Phase II: Increasing Strength', missionsCount: 18, description: 'Building endurance.' },
      { id: 'act3', title: 'Phase III: Long-term Health', missionsCount: 12, description: 'Locking in habits.' },
    ],
    totalSessions: 36,
    totalWeeks: 12,
  },
}

export const DEFAULT_STATE: GameState = {
  playerName: '',
  goal: '',
  currentSession: 0,
  completedSessions: [],
  lastSessionDate: null,
  viewedPowerups: [],
  startDate: null,
  profile: DEFAULT_PROFILE,
}

/** Get which rehab act/phase the patient is currently in */
export function getCurrentAct(session: number, plan: RehabPlan): RehabAct | null {
  let cumulative = 0
  for (const act of plan.acts) {
    cumulative += act.missionsCount
    if (session <= cumulative) return act
  }
  return plan.acts[plan.acts.length - 1]
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
