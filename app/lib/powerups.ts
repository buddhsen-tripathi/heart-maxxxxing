export type PowerupType =
  | 'health-tip'
  | 'goal-progress'
  | 'loved-one'
  | 'achievement'
  | 'heart-fact'
  | 'celebration'

export interface Powerup {
  session: number
  type: PowerupType
  title: string
  content: string
  icon: string
}

const POWERUP_SEQUENCE: Array<{
  type: PowerupType
  title: string
  content: string
  icon: string
}> = [
  {
    type: 'health-tip',
    title: 'Health Tip',
    content: 'Walking 30 minutes a day reduces hospital readmission by 30%. Every step counts!',
    icon: '🌿',
  },
  {
    type: 'goal-progress',
    title: 'Goal Progress',
    content: "You're 17% closer to your goal: {goal}",
    icon: '🎯',
  },
  {
    type: 'loved-one',
    title: 'Message from Ana',
    content: "We're so proud of you, Mom! Keep going — we're cheering you on every step of the way. 💕",
    icon: '💌',
  },
  {
    type: 'achievement',
    title: 'Steady Stepper',
    content: '12 sessions strong! You\'re in the top 25% of rehab patients. That takes real dedication.',
    icon: '⭐',
  },
  {
    type: 'heart-fact',
    title: 'Heart Fact',
    content: 'Your resting heart rate has likely started to improve. Cardiac rehab patients see a 7-10 BPM drop on average!',
    icon: '❤️‍🔬',
  },
  {
    type: 'health-tip',
    title: 'Health Tip',
    content: 'Each session strengthens the blood vessels around your stent. You\'re literally building a stronger heart.',
    icon: '🌿',
  },
  {
    type: 'goal-progress',
    title: 'Goal Progress',
    content: "You're 58% of the way to: {goal}. More than halfway there!",
    icon: '🎯',
  },
  {
    type: 'loved-one',
    title: 'Message from Ana',
    content: 'Mom, you inspire me every single day. I told my friends about your journey and they think you\'re amazing too. ❤️',
    icon: '💌',
  },
  {
    type: 'achievement',
    title: 'Iron Heart',
    content: '27 sessions completed! You\'re in the top 10% of all cardiac rehab patients. Unstoppable!',
    icon: '🏆',
  },
  {
    type: 'heart-fact',
    title: 'Heart Fact',
    content: 'Your heart is pumping more efficiently now. Studies show cardiac output improves 15-20% through rehab.',
    icon: '❤️‍🔬',
  },
  {
    type: 'health-tip',
    title: 'Health Tip',
    content: 'You\'ve built exercise habits that last a lifetime. Patients who finish rehab stay active for years after.',
    icon: '🌿',
  },
  {
    type: 'celebration',
    title: '🎉 YOU DID IT! 🎉',
    content: 'All 36 sessions complete! You\'ve reduced your risk of rehospitalization by 43%. Your heart — and everyone who loves you — thanks you.',
    icon: '👑',
  },
]

export function getPowerup(session: number, goal: string): Powerup | null {
  if (session <= 0 || session % 3 !== 0) return null
  const index = session / 3 - 1
  if (index < 0 || index >= POWERUP_SEQUENCE.length) return null

  const template = POWERUP_SEQUENCE[index]
  return {
    session,
    type: template.type,
    title: template.title,
    content: template.content.replace('{goal}', goal),
    icon: template.icon,
  }
}

/** Returns type/icon/title for a brick session — used as skeleton before LLM fills content */
export function getPowerupMeta(session: number): Omit<Powerup, 'content'> | null {
  if (session <= 0 || session % 3 !== 0) return null
  const index = session / 3 - 1
  if (index < 0 || index >= POWERUP_SEQUENCE.length) return null
  const template = POWERUP_SEQUENCE[index]
  return {
    session,
    type: template.type,
    title: template.title,
    icon: template.icon,
  }
}

export function getPowerupColor(type: PowerupType): string {
  switch (type) {
    case 'health-tip':
      return 'from-emerald-400 to-green-600'
    case 'goal-progress':
      return 'from-blue-400 to-indigo-600'
    case 'loved-one':
      return 'from-pink-400 to-rose-600'
    case 'achievement':
      return 'from-amber-400 to-yellow-600'
    case 'heart-fact':
      return 'from-red-400 to-rose-600'
    case 'celebration':
      return 'from-purple-400 via-pink-500 to-amber-500'
  }
}
