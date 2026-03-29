// Loads other active patients from data/patients.json as buddy markers

import patientsData from '../../data/patients.json'

export interface Buddy {
  id: string
  name: string
  session: number
  color: string
}

// Distinct NES-palette colors for buddy sprites
const BUDDY_COLORS = ['#00A800', '#FC7460', '#6888FC', '#F8B800', '#00A8A8']

/** Get active buddies, excluding the current player by name */
export function getBuddies(playerName: string): Buddy[] {
  return patientsData
    .filter(
      (p) =>
        p.status === 'active' &&
        p.current_session != null &&
        p.name.toLowerCase() !== playerName.toLowerCase(),
    )
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      session: p.current_session!,
      color: BUDDY_COLORS[i % BUDDY_COLORS.length],
    }))
}
