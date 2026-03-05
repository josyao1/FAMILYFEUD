'use client'

import { GameState } from '@/lib/types'
import AnswerTile from './AnswerTile'

type Props = {
  state: GameState
}

export default function FaceoffDisplay({ state }: Props) {
  const { currentQuestion, faceoff, teams, board } = state

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Question */}
      <div
        className="w-full text-center py-4 px-6 rounded-xl"
        style={{
          background: 'linear-gradient(180deg, #2a50c0 0%, #1a3aaa 100%)',
          border: '2px solid #6aaaf5',
        }}
      >
        <p className="text-white font-impact text-xl md:text-3xl uppercase tracking-wide">
          {currentQuestion?.question}
        </p>
      </div>

      {/* Answer tiles — flip when a faceoff answer is correct */}
      <div className="flex flex-col gap-2">
        {board.answers.map((answer, i) => (
          <AnswerTile
            key={i}
            index={i}
            text={answer.text}
            points={answer.points}
            revealed={answer.revealed}
          />
        ))}
      </div>

      {/* Team panels */}
      <div className="flex gap-3 mt-2">
        {([0, 1] as const).map(i => {
          const answer = i === 0 ? faceoff.team0Answer : faceoff.team1Answer
          const rank = i === 0 ? faceoff.team0Rank : faceoff.team1Rank
          const isWinner = faceoff.winnerTeam === i
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-all"
              style={{
                background: isWinner
                  ? 'linear-gradient(180deg, #1a6a1a 0%, #0d3d0d 100%)'
                  : 'linear-gradient(180deg, #1a3a9a 0%, #0d2060 100%)',
                border: isWinner ? '2px solid #4ade80' : '2px solid #6aaaf5',
                boxShadow: isWinner ? '0 0 16px rgba(74,222,128,0.3)' : 'none',
              }}
            >
              <span className="text-white font-impact text-base md:text-xl uppercase tracking-widest">
                {teams[i].name}
              </span>
              {teams[i].players.length > 0 && (
                <span className="text-yellow-300 font-impact text-sm md:text-base">
                  {teams[i].players[teams[i].faceoffIndex % teams[i].players.length]}
                </span>
              )}
              {answer && (
                <span className="text-yellow-300 font-impact text-lg md:text-2xl">{answer}</span>
              )}
              {answer && (
                <span className={`text-xs font-impact ${rank !== null ? 'text-green-400' : 'text-red-400'}`}>
                  {rank !== null ? `#${rank} ANSWER` : 'NOT ON BOARD'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
