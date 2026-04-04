'use client'

import { useState } from 'react'
import { GameState } from '@/lib/types'
import { nextRound, endGame } from '@/lib/gameActions'

type Props = {
  code: string
  state: GameState
}

export default function HostRoundEnd({ code, state }: Props) {
  const [multiplier, setMultiplier] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { teams, scores } = state

  async function handleNextRound() {
    setLoading(true)
    setError(null)
    try {
      await nextRound(code, state, multiplier)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start next round.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEndGame() {
    setLoading(true)
    setError(null)
    try {
      await endGame(code, state)
    } catch {
      setError('Failed to end game.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {error && <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}
      <h2 className="text-yellow-400 font-bold text-xl text-center">ROUND OVER</h2>

      {/* Scores */}
      <div className="flex gap-3">
        {([0, 1] as const).map(i => (
          <div key={i} className="flex-1 bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-xs uppercase">{teams[i].name}</p>
            <p className="text-yellow-400 font-bold text-4xl">{scores[i]}</p>
          </div>
        ))}
      </div>

      {/* 2x multiplier toggle */}
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-300 text-sm mb-3 text-center">Next Round Multiplier</p>
        <div className="flex gap-3">
          <button
            onClick={() => setMultiplier(1)}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
              multiplier === 1 ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300'
            }`}
          >
            1×
          </button>
          <button
            onClick={() => setMultiplier(2)}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
              multiplier === 2 ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300'
            }`}
          >
            2× BONUS
          </button>
        </div>
      </div>

      <button
        onClick={handleNextRound}
        disabled={loading}
        className="w-full py-5 bg-yellow-500 text-gray-900 font-bold text-2xl rounded-xl active:scale-95 transition-transform disabled:opacity-50"
      >
        Next Round →
      </button>

      <button
        onClick={handleEndGame}
        disabled={loading}
        className="w-full py-3 bg-gray-700 text-gray-300 font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
      >
        End Game
      </button>
    </div>
  )
}
