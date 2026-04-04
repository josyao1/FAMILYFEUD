'use client'

import { useState } from 'react'
import { GameState } from '@/lib/types'
import { revealAnswer, addStrike, offerSteal, endRound, advanceGuesser, editAnswer } from '@/lib/gameActions'

type Props = {
  code: string
  state: GameState
}

export default function HostPlaying({ code, state }: Props) {
  const { board, teams, currentQuestion } = state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  async function handleReveal(index: number) {
    if (board.answers[index].revealed) return
    setLoading(true)
    setError(null)
    try {
      await revealAnswer(code, state, index)
    } catch {
      setError('Failed to reveal answer.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStrike() {
    setLoading(true)
    setError(null)
    try {
      await addStrike(code, state)
    } catch {
      setError('Failed to add strike.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOfferSteal() {
    setLoading(true)
    setError(null)
    try {
      await offerSteal(code, state)
    } catch {
      setError('Failed to offer steal.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEndRound() {
    setLoading(true)
    setError(null)
    try {
      await endRound(code, state)
    } catch {
      setError('Failed to end round.')
    } finally {
      setLoading(false)
    }
  }

  async function handleNextPlayer() {
    setLoading(true)
    setError(null)
    try {
      await advanceGuesser(code, state)
    } catch {
      setError('Failed to advance player.')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(index: number, currentText: string) {
    setEditingIndex(index)
    setEditText(currentText)
  }

  async function submitEdit(index: number) {
    const trimmed = editText.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      await editAnswer(code, state, index, trimmed)
      setEditingIndex(null)
    } catch {
      setError('Failed to edit answer.')
    } finally {
      setLoading(false)
    }
  }

  const playingTeamData = teams[board.playingTeam]
  const players = playingTeamData.players
  const currentGuesser = players.length > 0 ? players[board.guesserIndex % players.length] : null
  const nextPlayer = players.length > 1 ? players[(board.guesserIndex + 1) % players.length] : null

  return (
    <div className="flex flex-col gap-4 p-4">
      {error && <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex items-center justify-between">
        <h2 className="text-yellow-400 font-bold text-lg">PLAYING</h2>
        <div className="text-gray-300 text-sm">
          <span className="text-white font-bold">{playingTeamData.name}</span>
        </div>
      </div>

      {/* Current guesser */}
      {currentGuesser && (
        <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Guessing now</p>
            <p className="text-yellow-400 font-bold text-xl">{currentGuesser}</p>
          </div>
          {nextPlayer && (
            <button
              onClick={handleNextPlayer}
              disabled={loading}
              className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg active:scale-95 disabled:opacity-50"
            >
              Next: {nextPlayer} →
            </button>
          )}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-3">
        <p className="text-white text-sm">{currentQuestion?.question}</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs">Round Points</p>
          <p className="text-yellow-400 font-bold text-2xl">{board.roundPoints}</p>
          {state.multiplier === 2 && <p className="text-yellow-300 text-xs">×2 bonus!</p>}
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs">Strikes</p>
          <p className="text-red-400 font-bold text-2xl">{board.strikes} / 3</p>
        </div>
      </div>

      {/* Answers */}
      <div className="flex flex-col gap-2">
        {board.answers.map((answer, i) => (
          <div key={i}>
            {editingIndex === i ? (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitEdit(i)
                    if (e.key === 'Escape') setEditingIndex(null)
                  }}
                  className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg border border-yellow-500 text-sm"
                />
                <button
                  onClick={() => submitEdit(i)}
                  disabled={loading}
                  className="px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg active:scale-95 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleReveal(i)}
                  disabled={answer.revealed || loading}
                  className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-all active:scale-95 ${
                    answer.revealed
                      ? 'bg-green-800 text-green-300 cursor-default opacity-70'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <span className="text-left">
                    <span className="text-gray-400 text-sm mr-2">#{i + 1}</span>
                    {answer.text}
                  </span>
                  <span className="text-yellow-400 font-bold ml-4">{answer.points}</span>
                </button>
                {!answer.revealed && (
                  <button
                    onClick={() => startEdit(i, answer.text)}
                    disabled={loading}
                    className="px-3 py-3 bg-gray-700 text-gray-400 rounded-lg active:scale-95 disabled:opacity-50 text-sm"
                    title="Edit answer"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Strike button */}
      <button
        onClick={handleStrike}
        disabled={loading || board.strikes >= 3}
        className="w-full py-4 bg-red-700 text-white font-bold text-xl rounded-xl active:scale-95 transition-transform disabled:opacity-40"
      >
        ✕ WRONG ANSWER
      </button>

      {/* Offer steal (shows after 3 strikes) */}
      {board.strikes >= 3 && (
        <button
          onClick={handleOfferSteal}
          disabled={loading}
          className="w-full py-4 bg-purple-700 text-white font-bold text-xl rounded-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          OFFER STEAL →
        </button>
      )}

      {/* End round early */}
      <button
        onClick={handleEndRound}
        disabled={loading}
        className="w-full py-3 bg-gray-700 text-gray-300 font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50 text-sm"
      >
        End Round (Award to {teams[board.playingTeam].name})
      </button>
    </div>
  )
}
