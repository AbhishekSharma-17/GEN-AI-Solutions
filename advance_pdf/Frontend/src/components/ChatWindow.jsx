import React, { useState } from 'react'
import { Box, TextField, Button, Typography, Paper } from '@mui/material'

const ChatWindow = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }])
      setInput('')
      // Here you would typically send the message to a backend
      // and then receive a response to add to the messages
      setTimeout(() => {
        setMessages(prev => [...prev, { text: 'This is a sample response.', sender: 'bot' }])
      }, 1000)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: 300, borderLeft: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Chat
      </Typography>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message, index) => (
          <Paper key={index} sx={{ p: 1, mb: 1, bgcolor: message.sender === 'user' ? 'primary.light' : 'secondary.light' }}>
            <Typography variant="body1">{message.text}</Typography>
          </Paper>
        ))}
      </Box>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <Button onClick={handleSend} sx={{ mt: 1 }} variant="contained">
          Send
        </Button>
      </Box>
    </Box>
  )
}

export default ChatWindow
