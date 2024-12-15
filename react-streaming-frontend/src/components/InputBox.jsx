import React, { useState } from 'react'

const InputBox = ({ onSendMessage, isStreaming }) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="input-box">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={isStreaming}
      />
      <button type="submit" disabled={isStreaming || !input.trim()}>
        Send
      </button>
    </form>
  )
}

export default InputBox
