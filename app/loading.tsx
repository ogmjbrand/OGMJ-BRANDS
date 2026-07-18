'use client'

import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#04060A] text-white">
      <div className="space-y-4 text-center">
        <motion.div
          className="mx-auto h-14 w-14 rounded-full border-4 border-[#C8FF00]/20 border-t-[#C8FF00]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">OGMJ BRANDS</p>
          <p className="text-lg font-semibold">Preparing your premium workspace</p>
        </div>
      </div>
    </div>
  )
}


