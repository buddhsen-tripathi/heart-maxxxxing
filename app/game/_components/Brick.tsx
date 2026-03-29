'use client'

interface BrickProps {
  session: number
  state: 'locked' | 'ready' | 'opened'
  onClick: () => void
}

export default function Brick({ session, state, onClick }: BrickProps) {
  return (
    <div
      onClick={() => {
        if (state === 'ready') onClick()
      }}
      className={`brick ${state}`}
      title={
        state === 'locked'
          ? `Reach session ${session} to unlock`
          : state === 'ready'
            ? 'Tap to reveal!'
            : 'Opened'
      }
    >
      {state === 'opened' ? '□' : '?'}
    </div>
  )
}
