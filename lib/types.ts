export type Phase = 'lobby' | 'faceoff' | 'playing' | 'steal' | 'roundend' | 'gameover'

export type Answer = {
  text: string
  points: number
}

export type Question = {
  id: string
  question: string
  answers: Answer[]
}

export type Team = {
  name: string
  players: string[]       // player names in order
  faceoffIndex: number    // which player index is doing the faceoff this round
}

export type GameState = {
  phase: Phase
  teams: [Team, Team]
  scores: [number, number]
  multiplier: 1 | 2
  usedQuestionIds: string[]
  currentQuestion: Question | null
  questionRevealed: boolean
  board: {
    answers: Array<Answer & { revealed: boolean }>
    strikes: number
    playingTeam: 0 | 1
    roundPoints: number
    guesserIndex: number  // index into playing team's players array
  }
  faceoff: {
    team0Answer: string | null
    team0Rank: number | null
    team1Answer: string | null
    team1Rank: number | null
    winnerTeam: 0 | 1 | null
    decision: 'pass' | 'play' | null
  }
  steal: {
    stealingTeam: 0 | 1 | null
    tileRevealed: boolean
  }
  timer: {
    startedAt: number | null  // Date.now() ms when started, null = idle
  }
}
