"use client"

import { Settings, Moon, Sun, Info } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function Header() {
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <header className="w-full flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center gap-2">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-c0PNWMxtTbCGPGVvgqh9a5TiQyAnIt.png"
          alt="GenAI Protos Logo"
          className="h-6 w-auto"
        />
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Information"
        >
          <Info className="h-4 w-4 text-gray-600" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-gray-600" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4 text-gray-600" />
        </motion.button>
      </div>
    </header>
  )
}

