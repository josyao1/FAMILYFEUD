'use client'

import { useState } from 'react'
import { GameState } from '@/lib/types'
import { setTeamName, setPlayers, startFaceoff } from '@/lib/gameActions'

type Props = {
  code: string
  state: GameState
}

function PlayerEditor({
  teamIndex,
  players,
  onChange,
}: {
  teamIndex: number
  players: string[]
  onChange: (players: string[]) => void
}) {
  const [input, setInput] = useState('')

  function addPlayer() {
    const name = input.trim()
    if (!name) return
    onChange([...players, name])
    setInput('')
  }

  function removePlayer(i: number) {
    onChange(players.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-1 bg-gray-700 rounded-full px-3 py-1">
            <span className="text-white text-sm">{p}</span>
            <button
              onClick={() => removePlayer(i)}
              className="text-gray-400 hover:text-red-400 text-xs ml-1 leading-none"
            >✕</button>
          </div>
        ))}
        {players.length === 0 && (
          <span className="text-gray-500 text-xs italic">No players added yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
          placeholder={`Add player to Team ${teamIndex + 1}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPlayer()}
        />
        <button
          onClick={addPlayer}
          className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg active:scale-95"
        >
          + Add
        </button>
      </div>
    </div>
  )
}

export default function HostLobby({ code, state }: Props) {
  const [teamNames, setTeamNames] = useState([state.teams[0].name, state.teams[1].name])
  const [playerLists, setPlayerLists] = useState([
    state.teams[0].players,
    state.teams[1].players,
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleNameBlur(i: 0 | 1) {
    if (teamNames[i] !== state.teams[i].name) {
      try {
        await setTeamName(code, state, i, teamNames[i])
      } catch {
        setError('Failed to update team name.')
      }
    }
  }

  async function handlePlayersChange(i: 0 | 1, players: string[]) {
    const newLists = [...playerLists]
    newLists[i] = players
    setPlayerLists(newLists)
    try {
      await setPlayers(code, state, i, players)
    } catch {
      setError('Failed to update players.')
    }
  }

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      await startFaceoff(code, state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start game.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {error && <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}
      <h2 className="text-yellow-400 font-bold text-xl text-center">LOBBY</h2>

      {([0, 1] as const).map(i => (
        <div key={i} className="flex flex-col gap-3 bg-gray-800 rounded-xl p-4">
          <input
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-lg font-bold focus:outline-none focus:border-yellow-400"
            value={teamNames[i]}
            onChange={e => setTeamNames(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
            onBlur={() => handleNameBlur(i)}
          />
          <PlayerEditor
            teamIndex={i}
            players={playerLists[i]}
            onChange={players => handlePlayersChange(i, players)}
          />
        </div>
      ))}

      <div className="p-3 bg-gray-800 rounded-lg text-center">
        <span className="text-gray-400 text-sm">Room Code: </span>
        <span className="text-yellow-400 font-bold text-2xl tracking-widest">{code}</span>
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full py-4 bg-yellow-500 text-gray-900 font-bold text-xl rounded-xl active:scale-95 transition-transform disabled:opacity-50"
      >
        {loading ? 'Starting...' : 'Start Game'}
      </button>
    </div>
  )
}
