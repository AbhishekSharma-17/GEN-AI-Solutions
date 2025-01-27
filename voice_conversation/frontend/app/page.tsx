"use client"

import { useState, useEffect, useRef } from "react"
import VoiceAgent from "./components/VoiceAgent"
import Header from "./components/Header"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [conversation, setConversation] = useState<Array<{ type: string; text: string; time: number | null }>>([])
  const [selectedVoice, setSelectedVoice] = useState('alloy')
  const [isLoading, setIsLoading] = useState(false)
  const [isAIResponseComplete, setIsAIResponseComplete] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const websocketRef = useRef<WebSocket | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaSourceRef = useRef<MediaSource | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const ttsAudioChunksRef = useRef<Uint8Array[]>([])

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
          }
          return newConversation
        })
        setIsAIResponseComplete(true)
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

  useEffect(() => {
    if (isAIResponseComplete && conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1]
      if (lastMessage.type === 'ai') {
        fetchTTS(lastMessage.text)
        setIsAIResponseComplete(false)
      }
    }
  }, [isAIResponseComplete, conversation])

  const appendNextChunk = () => {
    if (ttsAudioChunksRef.current.length && sourceBufferRef.current && !sourceBufferRef.current.updating) {
      const chunk = ttsAudioChunksRef.current.shift()
      if (chunk) {
        sourceBufferRef.current.appendBuffer(chunk)
      }
    }
  }

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
    setIsLoading(true)
    ttsAudioChunksRef.current = []

    try {
      const response = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(text)}&voice=${selectedVoice}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is null')
      }

      const mediaSource = new MediaSource()
      mediaSourceRef.current = mediaSource
      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(mediaSource)
      }

      mediaSource.addEventListener('sourceopen', async () => {
        sourceBufferRef.current = mediaSource.addSourceBuffer('audio/mpeg')
        sourceBufferRef.current.mode = 'sequence'
        sourceBufferRef.current.addEventListener('updateend', appendNextChunk)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            if (value) {
              ttsAudioChunksRef.current.push(value)
              if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
                appendNextChunk()
              }
            }

            if (audioRef.current && audioRef.current.readyState >= 2) {
              audioRef.current.play()
              setIsLoading(false)
            }
          }
          mediaSource.endOfStream()
        } catch (error) {
          console.error('Error while streaming:', error)
          setIsLoading(false)
        }
      })
    } catch (error) {
      console.error("Error fetching TTS:", error)
      setIsLoading(false)
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
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            isLoading={isLoading}
          />
          <audio ref={audioRef} style={{ display: 'none' }}>
            Your browser does not support the audio element.
          </audio>
        </main>
      </div>
    </div>
  )
}
