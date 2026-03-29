'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { type GameState } from '../../lib/game-state'
import { getQuickReplies } from '../../lib/coach-prompt'
import type { HealthTrends } from '../../lib/fitbit'
import LuigiIcon from './LuigiIcon'

interface ChatPanelProps {
  state: GameState
  onClose: () => void
  healthTrends?: HealthTrends | null
}

export default function ChatPanel({ state, onClose, healthTrends }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const quickReplies = useMemo(() => getQuickReplies(state), [state])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        gameState: state,
        healthTrends: healthTrends ?? null,
      },
    }),
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)

      // Auto-send on final result
      if (event.results[event.results.length - 1].isFinal) {
        const text = transcript.trim()
        if (text && status === 'ready') {
          sendMessage({ text })
          setInput('')
        }
        setIsListening(false)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }, [isListening, status, sendMessage])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || status !== 'ready') return
    sendMessage({ text: input.trim() })
    setInput('')
  }

  function handleQuickReply(text: string) {
    if (status !== 'ready') return
    sendMessage({ text })
  }

  const hasMessages = messages.length > 0
  const showQuickReplies = status === 'ready'
  const hasSpeech = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  return (
    <div className="fixed top-0 right-0 z-40 w-full h-full md:w-96 md:h-[70vh] md:mt-2 md:mr-2">
      <div className="chat-panel-enter w-full h-full flex flex-col bg-sky-950/95 backdrop-blur-md border border-sky-700/40 md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-sky-700/30 bg-sky-900/60">
          <div className="flex items-center gap-2">
            <LuigiIcon size={22} />
            <div>
              <h3 className="font-pixel text-[9px] text-emerald-400">Coach Heartley</h3>
              <p className="text-[10px] text-sky-400">Your rehab companion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-sky-400 hover:text-white hover:bg-sky-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
              <LuigiIcon size={48} />
              <p className="font-pixel text-[9px] text-emerald-400">Coach Heartley</p>
              <p className="text-sm text-sky-300/70">Ask me anything about your rehab journey, or just say hi.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-pink-600/80 text-white rounded-br-sm'
                    : 'bg-sky-800/80 text-sky-100 rounded-bl-sm'
                }`}
              >
                {message.role === 'assistant' && (
                  <LuigiIcon size={14} />
                )}
                {message.parts.map((part, index) =>
                  part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                )}
              </div>
            </div>
          ))}

          {status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-sky-800/80 text-sky-300 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                <LuigiIcon size={14} />
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="px-3 pb-1 flex gap-1.5 flex-wrap">
            {quickReplies.map((text) => (
              <button
                key={text}
                onClick={() => handleQuickReply(text)}
                className="px-2.5 py-1 text-[11px] bg-sky-800/50 hover:bg-sky-700/60 text-sky-300 hover:text-white border border-sky-700/30 rounded-full transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-sky-700/30 bg-sky-900/40">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Talk to Coach Heartley...'}
              disabled={status !== 'ready'}
              className="flex-1 px-3 py-2 bg-sky-900/60 border border-sky-700/40 rounded-lg text-white text-sm placeholder:text-sky-600 focus:outline-none focus:border-emerald-500/60 transition-colors disabled:opacity-50"
            />
            {hasSpeech && (
              <button
                type="button"
                onClick={toggleVoice}
                className={`px-3 py-2 rounded-lg text-sm transition-colors active:scale-95 ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                    : 'bg-sky-800 hover:bg-sky-700 text-sky-300 hover:text-white'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                🎤
              </button>
            )}
            <button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors active:scale-95"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
