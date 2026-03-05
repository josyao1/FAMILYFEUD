'use client'

import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  strikes: number
}

export default function StrikeDisplay({ strikes }: Props) {
  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2].map(i => (
        <div key={i} className="relative w-12 h-12 md:w-14 md:h-14">
          {/* Empty circle */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #1a3a9a 0%, #0d2060 100%)',
              border: '2px solid #6aaaf5',
            }}
          />
          <AnimatePresence>
            {i < strikes && (
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="absolute inset-0 flex items-center justify-center rounded-full"
                style={{
                  background: 'linear-gradient(180deg, #e03030 0%, #a01010 100%)',
                  border: '2px solid #ff6060',
                  boxShadow: '0 0 12px rgba(255,60,60,0.6)',
                }}
              >
                <span className="text-white font-impact font-bold text-2xl leading-none">✕</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
