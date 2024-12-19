import { useState } from 'react'
import './App.css'
import ChatBox from './components/ChatBox'
import InputBox from './components/InputBox'

function App() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const userId = "abhishek" // Set the user ID to "abhishek" as required by the backend

  const handleSendMessage = async (message) => {
    setMessages(prevMessages => [...prevMessages, { text: message, sender: 'user' }])
    setIsStreaming(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, question: message }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let aiResponse = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        aiResponse += chunk
        setMessages(prevMessages => {
          const newMessages = [...prevMessages]
          if (newMessages[newMessages.length - 1].sender === 'ai') {
            newMessages[newMessages.length - 1].text = aiResponse
          } else {
            newMessages.push({ text: aiResponse, sender: 'ai' })
          }
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prevMessages => [...prevMessages, { text: `Error: ${error.message}`, sender: 'system' }])
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="App">
      <h1>Real-time Streaming Chat</h1>
      <p>User ID: {userId}</p>
      <ChatBox messages={messages} isStreaming={isStreaming} />
      <InputBox onSendMessage={handleSendMessage} isStreaming={isStreaming} />
    </div>
  )
}

export default App
