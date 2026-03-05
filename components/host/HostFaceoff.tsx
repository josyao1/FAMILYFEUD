'use client'

import { useState } from 'react'
import { GameState } from '@/lib/types'
import {
  submitFaceoffAnswer,
  faceoffDecision,
  setFaceoffWinner,
  startFaceoff,
} from '@/lib/gameActions'

type Props = {
  code: string
  state: GameState
}

type Step = 'select_buzzer' | 'first_answer' | 'offer_counter' | 'counter_answer' | 'pass_play'

function AnswerPicker({
  answers,
  onPick,
  onNotOnBoard,
  disabled,
  disabledIndices = [],
}: {
  answers: { text: string; points: number }[]
  onPick: (text: string, rank: number) => void
  onNotOnBoard: () => void
  disabled: boolean
  disabledIndices?: number[]
}) {
  return (
    <div className="flex flex-col gap-2">
      {answers.map((a, i) => {
        const alreadyGuessed = disabledIndices.includes(i)
        return (
          <button
            key={i}
            onClick={() => onPick(a.text, i + 1)}
            disabled={disabled || alreadyGuessed}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold active:scale-95 transition-transform ${
              alreadyGuessed
                ? 'bg-gray-800 text-gray-500 cursor-default opacity-50'
                : 'bg-gray-700 text-white disabled:opacity-50'
            }`}
          >
            <span>
              <span className="text-gray-400 text-sm mr-2">#{i + 1}</span>
              {a.text}
              {alreadyGuessed && <span className="ml-2 text-xs text-gray-500">(already guessed)</span>}
            </span>
            <span className="text-yellow-400 font-bold ml-4">{a.points}</span>
          </button>
        )
      })}
      <button
        onClick={onNotOnBoard}
        disabled={disabled}
        className="w-full py-3 bg-red-900 text-red-300 rounded-lg font-semibold active:scale-95 transition-transform disabled:opacity-50 text-sm"
      >
        ✕ Not on the board
      </button>
    </div>
  )
}

export default function HostFaceoff({ code, state }: Props) {
  const { faceoff, teams, currentQuestion } = state
  const [firstTeam, setFirstTeam] = useState<0 | 1 | null>(null)
  const [step, setStep] = useState<Step>('select_buzzer')
  const [loading, setLoading] = useState(false)
  const [guessedIndices, setGuessedIndices] = useState<number[]>([])

  const answers = currentQuestion?.answers ?? []
  const counterTeam: 0 | 1 | null = firstTeam === null ? null : firstTeam === 0 ? 1 : 0
  const winner = faceoff.winnerTeam

  async function handleSelectBuzzer(team: 0 | 1) {
    setFirstTeam(team)
    setStep('first_answer')
  }

  async function handleFirstAnswer(text: string, rank: number | null) {
    if (firstTeam === null) return
    setLoading(true)
    if (rank !== null) setGuessedIndices(prev => [...prev, rank - 1])
    await submitFaceoffAnswer(code, state, firstTeam, text, rank)
    setLoading(false)
    setStep('offer_counter')
  }

  async function handleCounterAnswer(text: string, rank: number | null) {
    if (counterTeam === null) return
    setLoading(true)
    if (rank !== null) setGuessedIndices(prev => [...prev, rank - 1])
    await submitFaceoffAnswer(code, state, counterTeam, text, rank)
    setLoading(false)
    setStep('pass_play')
  }

  function handleGoAgain() {
    // Both missed — T1 (firstTeam) guesses again
    setStep('first_answer')
  }

  async function handleSetWinner(team: 0 | 1) {
    setLoading(true)
    await setFaceoffWinner(code, state, team)
    setLoading(false)
    setStep('pass_play')
  }

  async function handleDecision(decision: 'pass' | 'play') {
    setLoading(true)
    await faceoffDecision(code, state, decision)
    setLoading(false)
  }

  async function handleSkipQuestion() {
    setLoading(true)
    setStep('select_buzzer')
    setFirstTeam(null)
    await startFaceoff(code, state)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-yellow-400 font-bold text-lg">FACE-OFF</h2>
        <button
          onClick={handleSkipQuestion}
          disabled={loading}
          className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg active:scale-95 disabled:opacity-50"
        >
          Skip Question
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-3">
        <p className="text-white text-sm">{currentQuestion?.question}</p>
      </div>

      {/* Always-visible answer reference */}
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Answers</p>
        <div className="flex flex-col gap-1">
          {answers.map((a, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300"><span className="text-gray-500 mr-2">#{i + 1}</span>{a.text}</span>
              <span className="text-yellow-400 font-bold">{a.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP: Who buzzed first */}
      {step === 'select_buzzer' && (
        <div>
          <p className="text-gray-400 text-sm mb-2">Who buzzed in first?</p>
          <div className="flex gap-3">
            {([0, 1] as const).map(i => (
              <button
                key={i}
                onClick={() => handleSelectBuzzer(i)}
                className="flex-1 py-4 bg-blue-700 text-white font-bold text-lg rounded-xl active:scale-95"
              >
                {teams[i].name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP: First team picks an answer */}
      {step === 'first_answer' && firstTeam !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-300 text-sm mb-1">
            <span className="text-yellow-400 font-bold">{teams[firstTeam].name}</span> — pick their answer:
          </p>
          <AnswerPicker
            answers={answers}
            onPick={(text, rank) => handleFirstAnswer(text, rank)}
            onNotOnBoard={() => handleFirstAnswer('(not on board)', null)}
            disabled={loading}
            disabledIndices={guessedIndices}
          />
        </div>
      )}

      {/* STEP: Offer counter-guess */}
      {step === 'offer_counter' && counterTeam !== null && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs">
              {firstTeam !== null ? teams[firstTeam].name : ''} answered:{' '}
              <span className="text-white font-bold">
                {firstTeam === 0 ? faceoff.team0Answer : faceoff.team1Answer}
              </span>
              {(firstTeam === 0 ? faceoff.team0Rank : faceoff.team1Rank) !== null ? (
                <span className="text-green-400 ml-2">✓ on board</span>
              ) : (
                <span className="text-red-400 ml-2">✕ not on board</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setStep('counter_answer')}
            className="w-full py-4 bg-blue-700 text-white font-bold text-lg rounded-xl active:scale-95"
          >
            {teams[counterTeam].name} Counter-Guess →
          </button>
          <button
            onClick={() => setStep('pass_play')}
            className="w-full py-2 bg-gray-700 text-gray-300 text-sm rounded-xl active:scale-95"
          >
            Skip Counter (No Guess)
          </button>
        </div>
      )}

      {/* STEP: Counter team picks an answer */}
      {step === 'counter_answer' && counterTeam !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-300 text-sm mb-1">
            <span className="text-yellow-400 font-bold">{teams[counterTeam].name}</span> — pick their counter-guess:
          </p>
          <AnswerPicker
            answers={answers}
            onPick={(text, rank) => handleCounterAnswer(text, rank)}
            onNotOnBoard={() => handleCounterAnswer('(not on board)', null)}
            disabled={loading}
            disabledIndices={guessedIndices}
          />
        </div>
      )}

      {/* Submitted answers summary */}
      {(faceoff.team0Answer || faceoff.team1Answer) && (
        <div className="flex gap-3">
          {([0, 1] as const).map(i => {
            const answer = i === 0 ? faceoff.team0Answer : faceoff.team1Answer
            const rank = i === 0 ? faceoff.team0Rank : faceoff.team1Rank
            if (!answer) return <div key={i} className="flex-1" />
            return (
              <div
                key={i}
                className="flex-1 bg-gray-800 rounded-lg p-3 text-center"
                style={{ border: winner === i ? '1px solid #4ade80' : '1px solid #374151' }}
              >
                <p className="text-yellow-400 text-xs font-bold uppercase">{teams[i].name}</p>
                <p className="text-white text-sm mt-1">{answer}</p>
                <p className={`text-xs mt-1 ${rank !== null ? 'text-green-400' : 'text-red-400'}`}>
                  {rank !== null ? `#${rank} answer ✓` : 'Not on board ✕'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* STEP: Pass / Play */}
      {step === 'pass_play' && (
        <div className="flex flex-col gap-3">
          {winner === null && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGoAgain}
                className="w-full py-4 bg-blue-700 text-white font-bold text-lg rounded-xl active:scale-95"
              >
                Both missed — {firstTeam !== null ? teams[firstTeam].name : 'Team 1'} guesses again →
              </button>
              <p className="text-gray-500 text-xs text-center">or override winner:</p>
              <div className="flex gap-2">
                {([0, 1] as const).map(i => (
                  <button
                    key={i}
                    onClick={() => handleSetWinner(i)}
                    disabled={loading}
                    className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg font-bold text-sm active:scale-95 disabled:opacity-50"
                  >
                    {teams[i].name} Won
                  </button>
                ))}
              </div>
            </div>
          )}
          {winner !== null && (
            <>
              <p className="text-gray-300 text-sm text-center">
                <span className="text-yellow-400 font-bold">{teams[winner].name}</span> won — Pass or Play?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDecision('play')}
                  disabled={loading}
                  className="flex-1 py-5 bg-green-600 text-white font-bold text-2xl rounded-xl active:scale-95 disabled:opacity-50"
                >
                  PLAY
                </button>
                <button
                  onClick={() => handleDecision('pass')}
                  disabled={loading}
                  className="flex-1 py-5 bg-orange-600 text-white font-bold text-2xl rounded-xl active:scale-95 disabled:opacity-50"
                >
                  PASS
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
