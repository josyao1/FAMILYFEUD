import { Team } from '@/lib/types'

type Props = {
  teams: [Team, Team]
  scores: [number, number]
  playingTeam?: 0 | 1 | null
  multiplier?: 1 | 2
  guesserIndex?: number
}

export default function ScoreHeader({ teams, scores, playingTeam, multiplier, guesserIndex }: Props) {
  return (
    <div className="flex items-stretch gap-3 w-full">
      {([0, 1] as const).map(i => {
        const isPlaying = playingTeam === i
        const players = teams[i].players
        const currentGuesser = isPlaying && players.length > 0 && guesserIndex !== undefined
          ? players[guesserIndex % players.length]
          : null

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-300"
            style={{
              background: isPlaying
                ? 'linear-gradient(180deg, #4a7fe8 0%, #2a5ad8 100%)'
                : 'linear-gradient(180deg, #1a3a9a 0%, #0d2470 100%)',
              border: isPlaying ? '2px solid #f5c518' : '2px solid #6aaaf5',
              boxShadow: isPlaying
                ? '0 0 16px rgba(245,197,24,0.4), inset 0 1px 4px rgba(255,255,255,0.2)'
                : 'inset 0 1px 4px rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-white font-impact text-sm md:text-base uppercase tracking-widest">
              {teams[i].name}
            </span>
            <span
              className="font-impact text-3xl md:text-4xl leading-tight"
              style={{ color: '#f5c518', textShadow: '0 0 12px rgba(245,197,24,0.7)' }}
            >
              {scores[i]}
            </span>
            {currentGuesser && (
              <span className="text-yellow-200 font-impact text-sm md:text-base mt-1 animate-pulse">
                {currentGuesser}
              </span>
            )}
          </div>
        )
      })}

      {multiplier === 2 && (
        <div className="flex items-center justify-center px-2">
          <span className="text-yellow-400 font-impact font-bold text-xl animate-pulse">2×</span>
        </div>
      )}
    </div>
  )
}
