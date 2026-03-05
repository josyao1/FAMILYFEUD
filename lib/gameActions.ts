import { supabase } from './supabase'
import { GameState, Question, Team } from './types'
import questions from '../data/questions.json'

async function updateState(code: string, state: GameState) {
  const { error } = await supabase
    .from('familyfeud_games')
    .update({ state })
    .eq('code', code)
  if (error) throw error
}

export function getInitialState(): GameState {
  return {
    phase: 'lobby',
    teams: [
      { name: 'Team 1', players: [], faceoffIndex: 0 },
      { name: 'Team 2', players: [], faceoffIndex: 0 },
    ],
    scores: [0, 0],
    multiplier: 1,
    usedQuestionIds: [],
    currentQuestion: null,
    board: {
      answers: [],
      strikes: 0,
      playingTeam: 0,
      roundPoints: 0,
      guesserIndex: 0,
    },
    faceoff: {
      team0Answer: null,
      team0Rank: null,
      team1Answer: null,
      team1Rank: null,
      winnerTeam: null,
      decision: null,
    },
    steal: {
      stealingTeam: null,
    },
  }
}

function pickQuestion(usedIds: string[]): Question | null {
  const available = (questions as Question[]).filter(q => !usedIds.includes(q.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

function nextIndex(current: number, length: number): number {
  if (length === 0) return 0
  return (current + 1) % length
}

function oppositeTeam(team: 0 | 1): 0 | 1 {
  return team === 0 ? 1 : 0
}

function makeRoundState(question: Question) {
  return {
    board: {
      answers: question.answers.map(a => ({ ...a, revealed: false })),
      strikes: 0,
      playingTeam: 0 as 0 | 1,
      roundPoints: 0,
      guesserIndex: 0,
    },
    faceoff: {
      team0Answer: null,
      team0Rank: null,
      team1Answer: null,
      team1Rank: null,
      winnerTeam: null as 0 | 1 | null,
      decision: null as 'pass' | 'play' | null,
    },
    steal: { stealingTeam: null as 0 | 1 | null },
  }
}

export async function setTeamName(code: string, state: GameState, team: 0 | 1, name: string) {
  const newTeams: [Team, Team] = [
    { ...state.teams[0], name: team === 0 ? name : state.teams[0].name },
    { ...state.teams[1], name: team === 1 ? name : state.teams[1].name },
  ]
  await updateState(code, { ...state, teams: newTeams })
}

export async function setPlayers(code: string, state: GameState, team: 0 | 1, players: string[]) {
  const newTeams: [Team, Team] = [
    { ...state.teams[0], players: team === 0 ? players : state.teams[0].players },
    { ...state.teams[1], players: team === 1 ? players : state.teams[1].players },
  ]
  await updateState(code, { ...state, teams: newTeams })
}

export async function startFaceoff(code: string, state: GameState, questionId?: string) {
  let question: Question | null
  if (questionId) {
    question = (questions as Question[]).find(q => q.id === questionId) ?? null
  } else {
    question = pickQuestion(state.usedQuestionIds)
  }
  if (!question) return

  const newState: GameState = {
    ...state,
    phase: 'faceoff',
    currentQuestion: question,
    ...makeRoundState(question),
  }
  await updateState(code, newState)
}

export async function submitFaceoffAnswer(
  code: string,
  state: GameState,
  team: 0 | 1,
  answerText: string,
  rank: number | null
) {
  const newFaceoff = { ...state.faceoff }
  if (team === 0) {
    newFaceoff.team0Answer = answerText
    newFaceoff.team0Rank = rank
  } else {
    newFaceoff.team1Answer = answerText
    newFaceoff.team1Rank = rank
  }

  let answers = state.board.answers
  let roundPoints = state.board.roundPoints
  if (rank !== null) {
    answers = answers.map((a, i) => i === rank - 1 ? { ...a, revealed: true } : a)
    roundPoints += state.board.answers[rank - 1].points
  }

  let winnerTeam: 0 | 1 | null = newFaceoff.winnerTeam
  const t0Done = newFaceoff.team0Answer !== null
  const t1Done = newFaceoff.team1Answer !== null
  if (t0Done && t1Done) {
    const r0 = newFaceoff.team0Rank
    const r1 = newFaceoff.team1Rank
    if (r0 !== null && r1 !== null) {
      winnerTeam = r0 < r1 ? 0 : 1
    } else if (r0 !== null) {
      winnerTeam = 0
    } else if (r1 !== null) {
      winnerTeam = 1
    }
  }
  newFaceoff.winnerTeam = winnerTeam

  await updateState(code, {
    ...state,
    faceoff: newFaceoff,
    board: { ...state.board, answers, roundPoints },
  })
}

export async function setFaceoffWinner(code: string, state: GameState, team: 0 | 1) {
  await updateState(code, {
    ...state,
    faceoff: { ...state.faceoff, winnerTeam: team },
  })
}

export async function faceoffDecision(
  code: string,
  state: GameState,
  decision: 'pass' | 'play'
) {
  const winner = state.faceoff.winnerTeam!
  const playingTeam: 0 | 1 = decision === 'play' ? winner : ((1 - winner) as 0 | 1)

  // First guesser is the player AFTER the faceoff player on the playing team
  const playingTeamData = state.teams[playingTeam]
  const faceoffIdx = playingTeamData.faceoffIndex
  const guesserIndex = playingTeamData.players.length > 1
    ? nextIndex(faceoffIdx, playingTeamData.players.length)
    : faceoffIdx

  await updateState(code, {
    ...state,
    phase: 'playing',
    faceoff: { ...state.faceoff, decision },
    board: { ...state.board, playingTeam, guesserIndex },
  })
}

export async function advanceGuesser(code: string, state: GameState) {
  const playingTeam = state.board.playingTeam
  const players = state.teams[playingTeam].players
  const next = nextIndex(state.board.guesserIndex, players.length)
  await updateState(code, {
    ...state,
    board: { ...state.board, guesserIndex: next },
  })
}

export async function revealAnswer(code: string, state: GameState, answerIndex: number) {
  const answers = state.board.answers.map((a, i) =>
    i === answerIndex ? { ...a, revealed: true } : a
  )
  const addedPoints = state.board.answers[answerIndex].points
  const roundPoints = state.board.roundPoints + addedPoints
  const newBoard = { ...state.board, answers, roundPoints }

  const allRevealed = answers.every(a => a.revealed)

  if (allRevealed && state.phase === 'playing') {
    const points = roundPoints * state.multiplier
    const newScores: [number, number] = [...state.scores] as [number, number]
    newScores[state.board.playingTeam] += points
    await updateState(code, { ...state, board: newBoard, phase: 'roundend', scores: newScores })
  } else {
    await updateState(code, { ...state, board: newBoard })
  }
}

export async function addStrike(code: string, state: GameState) {
  const strikes = state.board.strikes + 1
  const playingTeam = state.board.playingTeam
  const players = state.teams[playingTeam].players
  const nextGuesser = nextIndex(state.board.guesserIndex, players.length)
  const newState: GameState = {
    ...state,
    board: { ...state.board, strikes, guesserIndex: nextGuesser },
  }

  if (strikes >= 3) {
    const stealingTeam = oppositeTeam(playingTeam)
    await updateState(code, { ...newState, phase: 'steal', steal: { stealingTeam } })
  } else {
    await updateState(code, newState)
  }
}

export async function offerSteal(code: string, state: GameState) {
  const stealingTeam = oppositeTeam(state.board.playingTeam)
  await updateState(code, {
    ...state,
    phase: 'steal',
    steal: { stealingTeam },
  })
}

export async function resolveSteal(code: string, state: GameState, correct: boolean) {
  const stealingTeam = state.steal.stealingTeam!
  const playingTeam = state.board.playingTeam
  const winningTeam = correct ? stealingTeam : playingTeam
  const points = state.board.roundPoints * state.multiplier

  const newScores: [number, number] = [...state.scores] as [number, number]
  newScores[winningTeam] += points

  const answers = state.board.answers.map(a => ({ ...a, revealed: true }))

  await updateState(code, {
    ...state,
    phase: 'roundend',
    scores: newScores,
    board: { ...state.board, answers },
  })
}

export async function revealStealAnswer(code: string, state: GameState, answerIndex: number) {
  const answers = state.board.answers.map((a, i) =>
    i === answerIndex ? { ...a, revealed: true } : a
  )
  const addedPoints = state.board.answers[answerIndex].points
  const roundPoints = state.board.roundPoints + addedPoints
  await updateState(code, { ...state, board: { ...state.board, answers, roundPoints } })
}

export async function endRound(code: string, state: GameState) {
  const points = state.board.roundPoints * state.multiplier
  const playingTeam = state.board.playingTeam
  const newScores: [number, number] = [...state.scores] as [number, number]
  newScores[playingTeam] += points

  await updateState(code, {
    ...state,
    phase: 'roundend',
    scores: newScores,
  })
}

export async function nextRound(code: string, state: GameState, multiplier: 1 | 2) {
  const usedQuestionIds = [
    ...state.usedQuestionIds,
    ...(state.currentQuestion ? [state.currentQuestion.id] : []),
  ]
  const question = pickQuestion(usedQuestionIds)

  if (!question) {
    await updateState(code, { ...state, phase: 'gameover', usedQuestionIds })
    return
  }

  // Advance faceoff player for both teams
  const newTeams: [Team, Team] = [
    {
      ...state.teams[0],
      faceoffIndex: nextIndex(state.teams[0].faceoffIndex, state.teams[0].players.length || 1),
    },
    {
      ...state.teams[1],
      faceoffIndex: nextIndex(state.teams[1].faceoffIndex, state.teams[1].players.length || 1),
    },
  ]

  await updateState(code, {
    ...state,
    phase: 'faceoff',
    multiplier,
    usedQuestionIds,
    teams: newTeams,
    currentQuestion: question,
    ...makeRoundState(question),
  })
}

export async function endGame(code: string, state: GameState) {
  await updateState(code, { ...state, phase: 'gameover' })
}
