"use client"

import { useState, useEffect, useRef } from "react"
import VoiceAgent from "./components/VoiceAgent"
import Header from "./components/Header"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<Array<{ type: string; text: string; time: number | null }>>([])
  const [audioUrl, setAudioUrl] = useState("")
  const [selectedVoice, setSelectedVoice] = useState('alloy')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const websocketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    websocketRef.current = new WebSocket('ws://localhost:8000/ws')
    
    websocketRef.current.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.transcription) {
        setConversation(prev => [
          ...prev,
          { type: 'user', text: data.transcription, time: data.transcription_time }
        ])
      } else if (data.ai_response_chunk) {
        setConversation(prev => {
          const newConversation = [...prev]
          const lastMessage = newConversation[newConversation.length - 1]
          if (lastMessage && lastMessage.type === 'ai') {
            // Append the new chunk, but remove any duplicated content
            const newText = lastMessage.text + data.ai_response_chunk
            lastMessage.text = newText.replace(/(.+)(?=\1)/g, "")
          } else {
            newConversation.push({ type: 'ai', text: data.ai_response_chunk, time: null })
          }
          return newConversation
        })
      } else if (data.ai_response_complete) {
        setConversation(prev => {
          const newConversation = [...prev]
          const lastMessage = newConversation[newConversation.length - 1]
          if (lastMessage && lastMessage.type === 'ai') {
            lastMessage.time = data.ai_response_time
            fetchTTS(lastMessage.text)
          }
          return newConversation
        })
      }
    }

    websocketRef.current.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [])

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(audioBlob)
        }
      }

      mediaRecorderRef.current.start()
      setIsListening(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
  }

  const fetchTTS = async (text: string) => {
    try {
      const response = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(text)}&voice=${selectedVoice}`)
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      setAudioUrl(audioUrl)
    } catch (error) {
      console.error("Error fetching TTS:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(176,196,222,0.1),rgba(176,196,222,0.2))]" />
      <div className="relative z-10">
        <Header />
        <main className="flex flex-col items-center justify-center p-8">
          <VoiceAgent
            isConnected={isConnected}
            isListening={isListening}
            startListening={startListening}
            stopListening={stopListening}
            conversation={conversation}
            audioUrl={audioUrl}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
          />
        </main>
      </div>
    </div>
  )
}
