"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Clock, Trash2, Sparkles, Wifi, WifiOff } from "lucide-react"
import VoiceWave from "./VoiceWave"

interface VoiceAgentProps {
  isConnected: boolean
  isListening: boolean
  startListening: () => void
  stopListening: () => void
  conversation: Array<{ type: string; text: string; time: number | null }>
  selectedVoice: string
  setSelectedVoice: (voice: string) => void
  isLoading: boolean
}

export default function VoiceAgent({
  isConnected,
  isListening,
  startListening,
  stopListening,
  conversation,
  selectedVoice,
  setSelectedVoice,
  isLoading,
}: VoiceAgentProps) {
  const [showHistory, setShowHistory] = useState(false)

  const handleListen = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const voiceOptions = ['Castiel', 'Harry', 'Lyla', 'Selena', 'Abhishek', 'Hiten']

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl font-bold text-center text-gray-800">Protos Voice Agent</h1>
        </div>

        <div className="flex items-center justify-center gap-4">
          <motion.button
            className={`p-6 rounded-2xl ${
              isListening ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"
            } shadow-md`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleListen}
            disabled={!isConnected}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </motion.button>

          <motion.button
            className="p-4 rounded-xl bg-gray-100 text-gray-600 shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(!showHistory)}
          >
            <Clock size={24} />
          </motion.button>

          {isConnected ? <Wifi className="text-green-500" size={24} /> : <WifiOff className="text-red-500" size={24} />}

          <div className="relative inline-block text-left">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            >
              {voiceOptions.map((voice) => (
                <option key={voice} value={voice.toLowerCase()}>
                  {voice}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center items-center"
            >
              <VoiceWave />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {conversation.map((message, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-xl border ${
                message.type === 'user' ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * index }}
            >
              <h2 className={`text-xl font-semibold mb-3 ${message.type === 'user' ? 'text-gray-700' : 'text-blue-700'}`}>
                {message.type === 'user' ? 'Transcription:' : 'AI Response:'}
              </h2>
              <p className="text-gray-600">{message.text}</p>
              {message.time !== null && (
                <p className="text-sm text-gray-400 mt-2">Time: {message.time.toFixed(2)}s</p>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
