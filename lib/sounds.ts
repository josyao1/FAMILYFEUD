'use client'

import { Howl } from 'howler'

let sounds: Record<string, Howl> | null = null

function getSounds() {
  if (sounds) return sounds
  sounds = {
    ding: new Howl({ src: ['/sounds/ding.mp3'], volume: 0.8 }),
    wrong: new Howl({ src: ['/sounds/wrong.mp3'], volume: 0.8 }),
    steal: new Howl({ src: ['/sounds/steal.mp3'], volume: 0.8 }),
    roundWin: new Howl({ src: ['/sounds/round-win.mp3'], volume: 0.8 }),
  }
  return sounds
}

export function playSound(name: 'ding' | 'wrong' | 'steal' | 'roundWin') {
  try {
    getSounds()[name]?.play()
  } catch {
    // Silently fail if sounds not loaded
  }
}
