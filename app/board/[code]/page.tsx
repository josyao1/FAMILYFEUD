'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GameState } from '@/lib/types'
import GameBoard from '@/components/board/GameBoard'

export default function BoardPage() {
  const { code } = useParams<{ code: string }>()
  const [state, setState] = useState<GameState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Initial fetch
    supabase
      .from('familyfeud_games')
      .select('state')
      .eq('code', code)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Game not found. Check the code.')
          return
        }
        setState(data.state as GameState)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`board-${code}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'familyfeud_games', filter: `code=eq.${code}` },
        payload => {
          setState((payload.new as { state: GameState }).state)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [code])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-xl font-impact">{error}</p>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-xl font-impact animate-pulse">Loading...</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0d1f6e 0%, #060f3a 100%)' }}
    >
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <GameBoard state={state} />
      </div>
      <div className="text-center mt-2">
        <span className="text-gray-700 text-xs font-impact tracking-widest">CODE: {code}</span>
      </div>
    </div>
  )
}
