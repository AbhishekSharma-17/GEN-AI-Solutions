import React, { useState } from 'react'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Avatar, 
  IconButton, 
  Tooltip,
  CircularProgress,
  Divider
} from '@mui/material'
import { 
  Send, 
  SmartToy, 
  Person, 
  AttachFile,
  EmojiEmotions,
  Mic,
  MoreVert,
  Close
} from '@mui/icons-material'

const ChatWindow = () => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }])
      setInput('')
      // Simulate bot typing
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { 
          text: 'I can help you analyze this PDF document. What would you like to know?', 
          sender: 'bot' 
        }])
      }, 1500)
    }
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              PDF Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isTyping ? 'Typing...' : 'Online'}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small">
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2, 
        bgcolor: 'grey.50',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {messages.map((message, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: 1,
            }}
          >
            {message.sender === 'bot' && (
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'primary.main',
                }}
              >
                <SmartToy sx={{ fontSize: 20 }} />
              </Avatar>
            )}
            <Paper 
              elevation={1} 
              sx={{ 
                maxWidth: '70%', 
                p: 1.5,
                borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                boxShadow: 2,
              }}
            >
              <Typography variant="body2">{message.text}</Typography>
            </Paper>
            {message.sender === 'user' && (
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: 'secondary.main',
                }}
              >
                <Person sx={{ fontSize: 20 }} />
              </Avatar>
            )}
          </Box>
        ))}
        {isTyping && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main',
              }}
            >
              <SmartToy sx={{ fontSize: 20 }} />
            </Avatar>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2,
                borderRadius: '20px 20px 20px 4px',
                bgcolor: 'background.paper',
              }}
            >
              <CircularProgress size={20} thickness={6} />
            </Paper>
          </Box>
        )}
      </Box>

      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mb: 1,
        }}>
          <Tooltip title="Attach file">
            <IconButton size="small" color="primary">
              <AttachFile />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add emoji">
            <IconButton size="small" color="primary">
              <EmojiEmotions />
            </IconButton>
          </Tooltip>
          <Tooltip title="Voice message">
            <IconButton size="small" color="primary">
              <Mic />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the PDF..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          <Button 
            onClick={handleSend} 
            variant="contained" 
            endIcon={<Send />}
            sx={{ 
              borderRadius: 3,
              px: 3,
              background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

export default ChatWindow
