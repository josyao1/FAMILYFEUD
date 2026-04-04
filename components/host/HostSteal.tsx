'use client'

import { useState } from 'react'
import { GameState } from '@/lib/types'
import { resolveSteal, revealStealAnswer } from '@/lib/gameActions'

type Props = {
  code: string
  state: GameState
}

export default function HostSteal({ code, state }: Props) {
  const { steal, teams, board, currentQuestion } = state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stealingTeam = steal.stealingTeam
  const tileRevealed = steal.tileRevealed

  async function handleRevealTile(index: number) {
    if (board.answers[index].revealed) return
    setLoading(true)
    setError(null)
    try {
      await revealStealAnswer(code, state, index)
    } catch {
      setError('Failed to reveal tile.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResolve(correct: boolean) {
    setLoading(true)
    setError(null)
    try {
      await resolveSteal(code, state, correct)
    } catch {
      setError('Failed to resolve steal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {error && <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}
      <h2 className="text-yellow-400 font-bold text-lg">STEAL</h2>

      <div className="bg-gray-800 rounded-lg p-3">
        <p className="text-white text-sm">{currentQuestion?.question}</p>
      </div>

      <div
        className="text-center py-4 rounded-xl"
        style={{ background: 'linear-gradient(135deg, #5b21b6, #2d0a6e)', border: '2px solid #a78bfa' }}
      >
        <p className="text-purple-200 text-sm uppercase tracking-widest">Stealing Team</p>
        <p className="text-white font-bold text-3xl mt-1">
          {stealingTeam !== null ? teams[stealingTeam].name : '—'}
        </p>
        <p className="text-purple-300 text-sm mt-1">
          Pot: <span className="text-yellow-400 font-bold">{board.roundPoints}</span> pts
          {state.multiplier === 2 && <span className="text-yellow-300"> ×2</span>}
        </p>
      </div>

      {/* Step 1: Click the matching tile to flip it */}
      {!tileRevealed && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-400 text-sm text-center">
            Tap the answer that matches their guess to flip it:
          </p>
          {board.answers.map((answer, i) => (
            <button
              key={i}
              onClick={() => handleRevealTile(i)}
              disabled={answer.revealed || loading}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-all active:scale-95 ${
                answer.revealed
                  ? 'bg-green-800 text-green-300 cursor-default opacity-60'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <span>
                <span className="text-gray-400 text-sm mr-2">#{i + 1}</span>
                {answer.text}
              </span>
              <span className="text-yellow-400 font-bold ml-4">{answer.points}</span>
            </button>
          ))}
          <button
            onClick={() => handleResolve(false)}
            disabled={loading}
            className="w-full py-2 bg-gray-700 text-gray-400 text-sm rounded-lg active:scale-95 mt-1 disabled:opacity-50"
          >
            Answer wasn&apos;t on board — Award to {stealingTeam !== null ? teams[stealingTeam === 0 ? 1 : 0].name : 'playing team'}
          </button>
        </div>
      )}

      {/* Step 2: Award points — always Team 0 first, Team 1 second */}
      {tileRevealed && (
        <div className="flex flex-col gap-3">
          <p className="text-gray-300 text-center text-sm">Award points to:</p>
          <div className="flex gap-3">
            {([0, 1] as const).map(i => (
              <button
                key={i}
                onClick={() => handleResolve(i === stealingTeam)}
                disabled={loading}
                className="flex-1 py-5 bg-green-700 text-white font-bold text-lg rounded-xl active:scale-95 transition-transform disabled:opacity-50"
              >
                ✓ {teams[i].name}
                {i === stealingTeam && (
                  <span className="block text-xs text-green-300 font-normal">stealing</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
