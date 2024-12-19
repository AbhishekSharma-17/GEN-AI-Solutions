import React from 'react'

const ChatBox = ({ messages, isStreaming }) => {
  return (
    <div className="chat-box">
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.sender}`}>
          {message.text}
        </div>
      ))}
      {isStreaming && <div className="streaming-indicator">AI is typing...</div>}
    </div>
  )
}

export default ChatBox
