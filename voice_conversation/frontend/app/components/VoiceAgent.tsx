"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Sparkles, Wifi, WifiOff } from "lucide-react"
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
  const handleListen = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const voiceOptions = ['Castiel', 'Harry', 'Lyla', 'Selena', 'Abhishek', 'Hiten']

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl font-bold text-center text-gray-800">Protos Voice Agent</h1>
        </div>

        <div className="flex items-center justify-center gap-6">
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

          {isConnected ? <Wifi className="text-green-500" size={24} /> : <WifiOff className="text-red-500" size={24} />}

          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="block appearance-none bg-blue-50 border border-blue-300 hover:border-blue-400 px-4 py-2 pr-8 rounded-lg shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          >
            {voiceOptions.map((voice) => (
              <option key={voice} value={voice.toLowerCase()}>
                {voice}
              </option>
            ))}
          </select>
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

        <div className="space-y-6">
          {conversation.length > 0 && (
            <>
              <motion.div
                className="p-6 rounded-xl border bg-gray-50 border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Current Transcription:</h2>
                <p className="text-gray-600">{conversation[conversation.length - 1].type === 'user' ? conversation[conversation.length - 1].text : 'Waiting for transcription...'}</p>
                {conversation[conversation.length - 1].type === 'user' && conversation[conversation.length - 1].time !== null && (
                  <p className="text-xs text-gray-500 mt-2">Time: {conversation[conversation.length - 1].time}</p>
                )}
              </motion.div>
              <motion.div
                className="p-6 rounded-xl border bg-blue-50 border-blue-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-semibold mb-3 text-blue-700">Current AI Response:</h2>
                <p className="text-gray-600">{conversation[conversation.length - 1].type === 'ai' ? conversation[conversation.length - 1].text : 'Waiting for AI response...'}</p>
                {conversation[conversation.length - 1].type === 'ai' && conversation[conversation.length - 1].time !== null && (
                  <p className="text-xs text-gray-500 mt-2">Time: {conversation[conversation.length - 1].time}</p>
                )}
              </motion.div>
            </>
          )}
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
