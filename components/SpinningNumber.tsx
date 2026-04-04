'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function computeStep(diff: number): number {
  if (diff <= 1) return 1
  const raw = diff / 4
  if (raw < 1) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  const normalized = raw / magnitude
  let nice: number
  if (normalized < 1.5) nice = magnitude
  else if (normalized < 3.5) nice = 2 * magnitude
  else if (normalized < 7.5) nice = 5 * magnitude
  else nice = 10 * magnitude
  return Math.max(1, nice)
}

type Props = {
  value: number
  className?: string
  style?: React.CSSProperties
}

export function SpinningNumber({ value, className = '', style }: Props) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)
  const increasingRef = useRef(true)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = to

    if (from === to) return

    const diff = Math.abs(to - from)
    const step = computeStep(diff)
    const direction = to > from ? 1 : -1
    increasingRef.current = direction > 0

    const sequence: number[] = []
    let cur = from + direction * step
    while (direction > 0 ? cur < to : cur > to) {
      sequence.push(Math.round(cur))
      cur += direction * step
    }
    sequence.push(to)

    let i = 0
    const id = setInterval(() => {
      setDisplayed(sequence[i])
      i++
      if (i >= sequence.length) clearInterval(id)
    }, 110)

    return () => clearInterval(id)
  }, [value])

  const enterY = increasingRef.current ? '70%' : '-70%'
  const exitY = increasingRef.current ? '-70%' : '70%'

  return (
    <motion.div
      className={`relative overflow-hidden leading-none ${className}`}
      style={{ display: 'inline-block', fontVariantNumeric: 'tabular-nums', ...style }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={displayed}
          initial={{ y: enterY, opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: exitY, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          style={{ display: 'block' }}
        >
          {displayed}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}
