'use client'

import { Howl } from 'howler'

let sounds: Record<string, Howl> | null = null

function getSounds() {
  if (sounds) return sounds
  sounds = {
    ding: new Howl({ src: ['/sounds/correct.wav'], volume: 0.8, html5: true }),
    wrong: new Howl({ src: ['/sounds/fail.mp3'], volume: 0.8, html5: true }),
    steal: new Howl({ src: ['/sounds/fail.mp3'], volume: 0.6, html5: true }),
    roundWin: new Howl({ src: ['/sounds/round-win.wav'], volume: 1.0, html5: true }),
  }
  return sounds
}

export function playSound(name: 'ding' | 'wrong' | 'steal' | 'roundWin') {
  console.log(`[sound] playing: ${name}`)
  try {
    const id = getSounds()[name]?.play()
    console.log(`[sound] play() returned id: ${id}`)
  } catch (e) {
    console.error(`[sound] error playing ${name}:`, e)
  }
}
