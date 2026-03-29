'use client'

interface FitbitConnectModalProps {
  onClose: () => void
}

export default function FitbitConnectModal({ onClose }: FitbitConnectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="modal-enter w-full max-w-sm">
        <div className="bg-sky-950/95 border-2 border-teal-500/40 rounded-2xl p-6 shadow-2xl text-center">
          <div className="text-5xl mb-4">⌚</div>

          <h2 className="font-pixel text-sm text-teal-400 mb-3 leading-relaxed">
            CONNECT GOOGLE FIT
          </h2>

          <p className="text-sky-300 text-sm mb-2 leading-relaxed">
            Track your real heart rate, steps, and activity alongside your rehab journey.
          </p>
          <p className="text-sky-500 text-xs mb-6 leading-relaxed">
            Your Fitbit data syncs through Google. We&apos;ll show you how much stronger
            you&apos;re getting since session 1.
          </p>

          <div className="space-y-3">
            <a
              href="/api/fitbit/authorize"
              className="block w-full py-3.5 px-6 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-pixel text-[10px] rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
            >
              CONNECT WITH GOOGLE
            </a>
            <button
              onClick={onClose}
              className="block w-full py-2.5 text-sky-500 hover:text-sky-400 font-pixel text-[9px] transition-colors"
            >
              MAYBE LATER
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
