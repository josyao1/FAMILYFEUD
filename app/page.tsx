'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateGame() {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/create-game', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push(`/host/${data.code}`)
    } catch {
      setError('Failed to create game. Check your Supabase config.')
      setCreating(false)
    }
  }

  function handleJoinBoard() {
    const code = joinCode.trim()
    if (code.length !== 6) {
      setError('Enter a 6-digit code.')
      return
    }
    router.push(`/board/${code}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      <div className="text-center">
        <h1 className="font-impact text-6xl md:text-8xl text-[#f5c518] uppercase tracking-widest drop-shadow-lg">
          Family Feud
        </h1>
        <p className="text-gray-400 text-lg mt-2">Survey says... let&apos;s play!</p>
      </div>

      {/* How to play */}
      <div className="w-full max-w-sm flex flex-col gap-2 text-sm">
        <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
          <span className="text-2xl leading-none mt-0.5">📱</span>
          <div>
            <p className="text-yellow-400 font-bold">Host phone</p>
            <p className="text-gray-300">Tap <span className="text-white font-semibold">Create New Game</span> — you&apos;ll control the whole game from this phone.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
          <span className="text-2xl leading-none mt-0.5">📺</span>
          <div>
            <p className="text-yellow-400 font-bold">Big screen</p>
            <p className="text-gray-300">On the TV or laptop, enter the 6-digit code below and tap <span className="text-white font-semibold">Board →</span> to show the game board.</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={handleCreateGame}
          disabled={creating}
          className="w-full py-5 bg-[#f5c518] text-[#0a1628] font-impact font-bold text-2xl rounded-2xl uppercase tracking-wide active:scale-95 transition-transform disabled:opacity-60 shadow-lg"
        >
          {creating ? 'Creating...' : 'Create New Game (Host)'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-sm">or join as board</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-4 text-2xl text-center font-impact tracking-widest focus:outline-none focus:border-yellow-400"
            placeholder="000000"
            maxLength={6}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleJoinBoard()}
          />
          <button
            onClick={handleJoinBoard}
            className="px-5 py-4 bg-gray-700 text-white font-bold rounded-xl active:scale-95 transition-transform"
          >
            Board →
          </button>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </main>
  )
}
