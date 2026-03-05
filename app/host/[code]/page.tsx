'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GameState } from '@/lib/types'
import HostLobby from '@/components/host/HostLobby'
import HostFaceoff from '@/components/host/HostFaceoff'
import HostPlaying from '@/components/host/HostPlaying'
import HostSteal from '@/components/host/HostSteal'
import HostRoundEnd from '@/components/host/HostRoundEnd'
import { setPlayers, startTimer, resetTimer } from '@/lib/gameActions'

function RosterEditor({ code, state }: { code: string; state: GameState }) {
  const [editing, setEditing] = useState<{ team: 0 | 1; idx: number; value: string } | null>(null)
  const [addInputs, setAddInputs] = useState<[string, string]>(['', ''])

  function startEdit(team: 0 | 1, idx: number) {
    setEditing({ team, idx, value: state.teams[team].players[idx] })
  }

  async function commitEdit() {
    if (!editing) return
    const { team, idx, value } = editing
    const name = value.trim()
    if (name && name !== state.teams[team].players[idx]) {
      const updated = state.teams[team].players.map((p, i) => i === idx ? name : p)
      await setPlayers(code, state, team, updated)
    }
    setEditing(null)
  }

  async function removePlayer(team: 0 | 1, idx: number) {
    const updated = state.teams[team].players.filter((_, i) => i !== idx)
    await setPlayers(code, state, team, updated)
  }

  async function addPlayer(team: 0 | 1) {
    const name = addInputs[team].trim()
    if (!name) return
    await setPlayers(code, state, team, [...state.teams[team].players, name])
    setAddInputs(prev => { const n = [...prev] as [string, string]; n[team] = ''; return n })
  }

  return (
    <div className="px-4 pb-3 bg-gray-900 border-b border-gray-800">
      <div className="flex gap-3">
        {([0, 1] as const).map(i => (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{state.teams[i].name}</p>
            {state.teams[i].players.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1">
                {editing?.team === i && editing?.idx === idx ? (
                  <input
                    autoFocus
                    className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-yellow-400 border border-yellow-400"
                    value={editing.value}
                    onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : prev)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit() }}
                  />
                ) : (
                  <button
                    className="flex-1 text-left text-white text-sm bg-gray-700 rounded px-2 py-1 truncate"
                    onClick={() => startEdit(i, idx)}
                  >
                    {p}
                  </button>
                )}
                <button
                  className="text-gray-500 hover:text-red-400 text-xs px-1"
                  onClick={() => removePlayer(i, idx)}
                >✕</button>
              </div>
            ))}
            <div className="flex gap-1 mt-1">
              <input
                className="flex-1 bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-yellow-400"
                placeholder="Add player..."
                value={addInputs[i]}
                onChange={e => setAddInputs(prev => { const n = [...prev] as [string, string]; n[i] = e.target.value; return n })}
                onKeyDown={e => { if (e.key === 'Enter') addPlayer(i) }}
              />
              <button
                className="px-2 py-1 bg-blue-700 text-white text-xs rounded"
                onClick={() => addPlayer(i)}
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HostPage() {
  const { code } = useParams<{ code: string }>()
  const [state, setState] = useState<GameState | null>(null)
  const [error, setError] = useState('')
  const [showRoster, setShowRoster] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    supabase
      .from('familyfeud_games')
      .select('state')
      .eq('code', code)
      .single()
      .then(({ data, error }) => {
        if (!isMounted) return
        if (error || !data) {
          setError('Game not found.')
          return
        }
        setState(data.state as GameState)
      })

    const channel = supabase
      .channel(`host-${code}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'familyfeud_games', filter: `code=eq.${code}` },
        payload => {
          setState((payload.new as { state: GameState }).state)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [code])

  useEffect(() => {
    if (!state?.timer?.startedAt) {
      setTimeLeft(null)
      return
    }
    const tick = () => {
      const elapsed = (Date.now() - state.timer.startedAt!) / 1000
      setTimeLeft(Math.max(0, 15 - elapsed))
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [state?.timer?.startedAt])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400 font-impact text-xl">{error}</p>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 font-impact text-xl animate-pulse">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-[#f5c518] font-impact text-xl uppercase tracking-wide">Host Panel</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRoster(r => !r)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${showRoster ? 'bg-yellow-500 text-gray-900 border-yellow-500' : 'text-gray-400 border-gray-600'}`}
          >
            Roster {showRoster ? '▲' : '▼'}
          </button>
          <div className="text-right">
            <span className="text-gray-500 text-xs">Code </span>
            <span className="text-white font-impact text-lg tracking-widest">{code}</span>
          </div>
        </div>
      </div>

      {/* Scores mini-bar */}
      <div className="flex gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
        {([0, 1] as const).map(i => (
          <div
            key={i}
            className="flex-1 flex justify-between items-center px-3 py-1 rounded"
            style={{
              background: state.board.playingTeam === i && state.phase === 'playing'
                ? 'rgba(245,197,24,0.1)'
                : 'transparent',
              border: state.board.playingTeam === i && state.phase === 'playing'
                ? '1px solid rgba(245,197,24,0.3)'
                : '1px solid transparent',
            }}
          >
            <span className="text-gray-300 text-sm truncate">{state.teams[i].name}</span>
            <span className="text-yellow-400 font-bold text-lg ml-2">{state.scores[i]}</span>
          </div>
        ))}
        {state.multiplier === 2 && (
          <span className="text-yellow-400 font-bold self-center text-sm">2×</span>
        )}
        {timeLeft === null ? (
          <button
            onClick={() => startTimer(code, state)}
            className="text-xs px-3 py-1 rounded-full border border-gray-600 text-gray-400 hover:border-yellow-400 hover:text-yellow-400 transition-colors self-center"
          >
            ⏱ 15s
          </button>
        ) : timeLeft === 0 ? (
          <button
            onClick={() => resetTimer(code, state)}
            className="text-xs px-3 py-1 rounded-full border border-red-500 text-red-400 animate-pulse self-center"
          >
            ✕ TIME
          </button>
        ) : (
          <button
            onClick={() => resetTimer(code, state)}
            className="text-xs px-3 py-1 rounded-full border border-yellow-500 text-yellow-400 self-center"
          >
            ✕ {Math.ceil(timeLeft)}s
          </button>
        )}
      </div>

      {showRoster && <RosterEditor code={code} state={state} />}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {state.phase === 'lobby' && <HostLobby code={code} state={state} />}
        {state.phase === 'faceoff' && <HostFaceoff key={state.currentQuestion?.id} code={code} state={state} />}
        {state.phase === 'playing' && <HostPlaying code={code} state={state} />}
        {state.phase === 'steal' && <HostSteal code={code} state={state} />}
        {state.phase === 'roundend' && <HostRoundEnd code={code} state={state} />}
        {state.phase === 'gameover' && (
          <div className="flex flex-col items-center justify-center gap-6 p-8">
            <h2 className="text-yellow-400 font-impact text-4xl">Game Over!</h2>
            <div className="flex gap-4">
              {([0, 1] as const).map(i => (
                <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">{state.teams[i].name}</p>
                  <p className="text-white font-impact text-4xl">{state.scores[i]}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full max-w-xs py-4 bg-yellow-500 text-gray-900 font-bold text-xl rounded-xl"
            >
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
