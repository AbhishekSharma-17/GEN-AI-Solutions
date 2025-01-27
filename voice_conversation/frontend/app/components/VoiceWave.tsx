"use client"

import { motion } from "framer-motion"

export default function VoiceWave() {
  const waveVariants = {
    animate: (i: number) => ({
      scaleY: [1, 1.5, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 0.6,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
        delay: i * 0.1,
      },
    }),
  }

  return (
    <div className="flex justify-center items-center space-x-1 h-8" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 h-full bg-blue-400 rounded-full"
          variants={waveVariants}
          animate="animate"
          custom={i}
        />
      ))}
    </div>
  )
}

