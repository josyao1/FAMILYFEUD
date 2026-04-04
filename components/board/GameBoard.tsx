'use client'

import { useEffect, useRef, useState } from 'react'
import { GameState } from '@/lib/types'
import AnswerTile from './AnswerTile'
import StrikeDisplay from './StrikeDisplay'
import ScoreHeader from './ScoreHeader'
import FaceoffDisplay from './FaceoffDisplay'
import { playSound } from '@/lib/sounds'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  state: GameState
}

function DotBorder() {
  const dots = Array.from({ length: 60 })
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {dots.map((_, i) => {
        const angle = (i / dots.length) * 2 * Math.PI
        const rx = 48, ry = 48
        const x = 50 + rx * Math.cos(angle)
        const y = 50 + ry * Math.sin(angle)
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              background: i % 2 === 0 ? '#f5c518' : '#ffffff',
              boxShadow: i % 2 === 0 ? '0 0 6px #f5c518' : '0 0 4px #ffffff',
              opacity: 0.85,
            }}
          />
        )
      })}
    </div>
  )
}

function PointsCounter({ points }: { points: number }) {
  return (
    <div
      className="flex items-center justify-center px-6 py-2 rounded-lg"
      style={{
        background: '#0a0a1a',
        border: '3px solid #3a6fd8',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(58,111,216,0.4)',
        minWidth: '100px',
      }}
    >
      <span
        className="font-impact text-4xl tracking-widest"
        style={{ color: '#f5c518', textShadow: '0 0 15px rgba(245,197,24,0.9)' }}
      >
        {points}
      </span>
    </div>
  )
}

function TimerDisplay({ startedAt }: { startedAt: number }) {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, 15 - (Date.now() - startedAt) / 1000)
  )

  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, 15 - (Date.now() - startedAt) / 1000))
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [startedAt])

  const expired = timeLeft === 0

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center"
    >
      {expired ? (
        <span
          className="font-impact text-5xl md:text-6xl uppercase tracking-widest animate-pulse"
          style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.8)' }}
        >
          TIME!
        </span>
      ) : (
        <span
          className="font-impact text-6xl md:text-7xl"
          style={{ color: '#f5c518', textShadow: '0 0 25px rgba(245,197,24,0.9)' }}
        >
          {Math.ceil(timeLeft)}
        </span>
      )}
    </motion.div>
  )
}

export default function GameBoard({ state }: Props) {
  const prevRevealCount = useRef(state.board.answers.filter(a => a.revealed).length)
  const prevStrikes = useRef(state.board.strikes)
  const prevPhase = useRef(state.phase)
  const [showX, setShowX] = useState(false)
  const xTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const revealCount = state.board.answers.filter(a => a.revealed).length

    if (revealCount > prevRevealCount.current) {
      playSound('ding')
    }
    prevRevealCount.current = revealCount

    if (state.board.strikes > prevStrikes.current) {
      playSound('wrong')
      setShowX(true)
      if (xTimerRef.current) clearTimeout(xTimerRef.current)
      xTimerRef.current = setTimeout(() => setShowX(false), 1800)
    }
    prevStrikes.current = state.board.strikes

    if (state.phase === 'steal' && prevPhase.current !== 'steal') playSound('steal')
    if (state.phase === 'roundend' && prevPhase.current !== 'roundend') playSound('roundWin')
    prevPhase.current = state.phase

  }, [state])

  useEffect(() => {
    return () => { if (xTimerRef.current) clearTimeout(xTimerRef.current) }
  }, [])

  const { phase, teams, scores, board, currentQuestion, multiplier } = state

  if (phase === 'lobby') {
    return (
      <div className="relative flex flex-col items-center justify-center h-full gap-8 rounded-2xl overflow-hidden py-12"
        style={{ background: 'linear-gradient(180deg, #1a3a9a 0%, #0d2060 100%)' }}>
        <DotBorder />
        <ScoreHeader teams={teams} scores={scores} />
        <div className="text-center z-10">
          <h1 className="font-impact text-6xl md:text-8xl uppercase tracking-widest drop-shadow-lg"
            style={{ color: '#f5c518', textShadow: '0 0 30px rgba(245,197,24,0.5)' }}>
            Family Feud
          </h1>
          <p className="text-white/60 font-impact text-2xl mt-4 animate-pulse">
            Waiting for host...
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'faceoff') {
    return (
      <div className="relative flex flex-col gap-4 w-full h-full rounded-2xl overflow-hidden py-6 px-4"
        style={{ background: 'linear-gradient(180deg, #1a3a9a 0%, #0d2060 100%)' }}>
        <DotBorder />
        <AnimatePresence>
          {state.timer?.startedAt != null && (
            <TimerDisplay key={state.timer.startedAt} startedAt={state.timer.startedAt} />
          )}
        </AnimatePresence>
        <div className="z-10">
          <ScoreHeader teams={teams} scores={scores} multiplier={multiplier} />
        </div>
        <div className="flex-1 flex items-start justify-center z-10 overflow-y-auto">
          <FaceoffDisplay state={state} />
        </div>
      </div>
    )
  }

  if (phase === 'playing' || phase === 'steal') {
    const playingTeam = board.playingTeam
    const stealingTeam = state.steal.stealingTeam

    return (
      <div className="relative flex flex-col gap-3 w-full h-full rounded-2xl overflow-hidden py-4 px-4"
        style={{ background: 'linear-gradient(180deg, #1a3a9a 0%, #0d2060 100%)' }}>
        <DotBorder />

        <AnimatePresence>
          {state.timer?.startedAt != null && (
            <TimerDisplay key={state.timer.startedAt} startedAt={state.timer.startedAt} />
          )}
        </AnimatePresence>

        {/* Full-screen X flash on wrong answer */}
        <AnimatePresence>
          {showX && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(180, 0, 0, 0.85)' }}
            >
              <span
                className="font-impact text-[25vw] leading-none"
                style={{ color: '#fff', textShadow: '0 0 60px rgba(255,100,100,0.9)' }}
              >
                ✕
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="z-10">
          <ScoreHeader teams={teams} scores={scores} playingTeam={playingTeam} multiplier={multiplier} guesserIndex={board.guesserIndex} />
        </div>

        <div
          className="z-10 text-center py-2 px-4 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, #2a50c0 0%, #1a3aaa 100%)',
            border: '2px solid #6aaaf5',
          }}
        >
          <p className="text-white font-impact text-lg md:text-2xl uppercase tracking-wide">
            {currentQuestion?.question}
          </p>
        </div>

        <div className="z-10 flex items-center justify-between px-2">
          <PointsCounter points={board.roundPoints} />
          <StrikeDisplay strikes={board.strikes} />
          <div style={{ minWidth: 100 }} />
        </div>

        <div className="z-10 flex-1 flex flex-col gap-2 overflow-y-auto">
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

        <AnimatePresence>
          {phase === 'steal' && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="z-10 py-3 text-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #7c1a1a, #3d0a0a)',
                border: '2px solid #f87171',
              }}
            >
              <span className="text-white font-impact text-2xl md:text-3xl uppercase tracking-widest">
                {stealingTeam !== null ? teams[stealingTeam].name : ''} — STEAL!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'roundend') {
    return (
      <div className="relative flex flex-col gap-3 w-full h-full rounded-2xl overflow-hidden py-4 px-4"
        style={{ background: 'linear-gradient(180deg, #1a3a9a 0%, #0d2060 100%)' }}>
        <DotBorder />
        <AnimatePresence>
          {state.timer?.startedAt != null && (
            <TimerDisplay key={state.timer.startedAt} startedAt={state.timer.startedAt} />
          )}
        </AnimatePresence>
        <div className="z-10">
          <ScoreHeader teams={teams} scores={scores} />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="z-10 text-center py-2"
        >
          <span className="font-impact text-4xl md:text-5xl uppercase"
            style={{ color: '#f5c518', textShadow: '0 0 20px rgba(245,197,24,0.7)' }}>
            Round Over!
          </span>
        </motion.div>
        <div className="z-10 flex-1 flex flex-col gap-2 overflow-y-auto">
          {board.answers.map((answer, i) => (
            <AnswerTile key={i} index={i} text={answer.text} points={answer.points} revealed={true} />
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'gameover') {
    const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : null
    return (
      <div className="relative flex flex-col items-center justify-center h-full gap-8 rounded-2xl overflow-hidden py-12"
        style={{ background: 'linear-gradient(180deg, #1a3a9a 0%, #0d2060 100%)' }}>
        <DotBorder />
        <motion.h1
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="font-impact text-6xl md:text-8xl uppercase tracking-widest z-10"
          style={{ color: '#f5c518', textShadow: '0 0 30px rgba(245,197,24,0.6)' }}
        >
          Game Over!
        </motion.h1>
        {winner !== null && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white font-impact text-3xl md:text-5xl uppercase z-10"
          >
            {teams[winner].name} Wins!
          </motion.div>
        )}
        {winner === null && (
          <div className="text-white font-impact text-3xl md:text-5xl z-10">It&apos;s a Tie!</div>
        )}
        <div className="z-10 w-full px-4">
          <ScoreHeader teams={teams} scores={scores} />
        </div>
      </div>
    )
  }

  return null
}
