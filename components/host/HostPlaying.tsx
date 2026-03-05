'use client'

import { useState } from 'react'
import { GameState } from '@/lib/types'
import { revealAnswer, addStrike, offerSteal, endRound, advanceGuesser } from '@/lib/gameActions'

type Props = {
  code: string
  state: GameState
}

export default function HostPlaying({ code, state }: Props) {
  const { board, teams, currentQuestion } = state
  const [loading, setLoading] = useState(false)

  async function handleReveal(index: number) {
    if (board.answers[index].revealed) return
    setLoading(true)
    await revealAnswer(code, state, index)
    setLoading(false)
  }

  async function handleStrike() {
    setLoading(true)
    await addStrike(code, state)
    setLoading(false)
  }

  async function handleOfferSteal() {
    setLoading(true)
    await offerSteal(code, state)
    setLoading(false)
  }

  async function handleEndRound() {
    setLoading(true)
    await endRound(code, state)
    setLoading(false)
  }

  async function handleNextPlayer() {
    setLoading(true)
    await advanceGuesser(code, state)
    setLoading(false)
  }

  const playingTeamData = teams[board.playingTeam]
  const players = playingTeamData.players
  const currentGuesser = players.length > 0 ? players[board.guesserIndex % players.length] : null
  const nextPlayer = players.length > 1 ? players[(board.guesserIndex + 1) % players.length] : null

  return (
    <div className="flex flex-col gap-4 p-4">
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
          <button
            key={i}
            onClick={() => handleReveal(i)}
            disabled={answer.revealed || loading}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-all active:scale-95 ${
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
