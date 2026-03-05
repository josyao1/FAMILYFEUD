'use client'

import { motion } from 'framer-motion'

type Props = {
  index: number
  text: string
  points: number
  revealed: boolean
}

export default function AnswerTile({ index, text, points, revealed }: Props) {
  return (
    <div className="relative w-full" style={{ height: '60px', perspective: '800px' }}>
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX: revealed ? 180 : 0 }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
      >
        {/* Hidden side */}
        <div
          className="absolute inset-0 flex items-center rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(180deg, #3a6fd8 0%, #1a4abf 50%, #1238a0 100%)',
            border: '2px solid #6aaaf5',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 3px 8px rgba(0,0,0,0.5)',
          }}
        >
          {/* Number circle */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ml-3"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #ffffff, #9fc8ff)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            <span className="font-impact text-[#1a3a8f] font-bold text-lg leading-none">
              {index + 1}
            </span>
          </div>
        </div>

        {/* Revealed side */}
        <div
          className="absolute inset-0 flex items-center justify-between px-4 rounded-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
            background: 'linear-gradient(180deg, #3a6fd8 0%, #1a4abf 50%, #1238a0 100%)',
            border: '2px solid #f5c518',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 3px 8px rgba(0,0,0,0.5)',
          }}
        >
          <span className="text-white font-impact text-xl md:text-2xl uppercase tracking-wide flex-1 ml-2">
            {text}
          </span>
          <span
            className="font-impact text-2xl md:text-3xl font-bold ml-4 px-3 py-1 rounded"
            style={{ color: '#f5c518', textShadow: '0 0 10px rgba(245,197,24,0.8)' }}
          >
            {points}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
