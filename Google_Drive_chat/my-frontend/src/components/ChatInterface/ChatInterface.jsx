/* eslint-disable no-loop-func */
import React, { useState, useRef, useEffect } from 'react';
import { Typography, TextField, Box, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import './ChatInterface.css'; 
import aiIcon from '../../assets/ai.png'
import Header from '../Header/Header';

const ChatInterface = () => {
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponses, setChatResponses] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatResponseRef = useRef(null);

  const handleQuestionChange = (event) => {
    setChatQuery(event.target.value);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    setChatResponses(prev => [...prev, { type: 'user', text: chatQuery }]);
    setChatQuery('');

    setIsChatLoading(true);
    
    try {

      const response = await fetch("http://localhost:8000/chat-te", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_query: chatQuery,
          namespace: "gdrive_search"
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';
      
      // Read the stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;
        setChatResponses(prev => {
          const updatedResponses = [...prev];
          const lastResponse = updatedResponses[updatedResponses.length - 1];
          if (lastResponse && lastResponse.type === 'bot') {
            lastResponse.text = responseText;
          } else {
            updatedResponses.push({ type: 'bot', text: responseText });
          }
          return updatedResponses;
        });
        if (chatResponseRef.current) {
          chatResponseRef.current.scrollTop = chatResponseRef.current.scrollHeight;
        }
      }
    } catch (err) {
      console.error("Error in chat request:", err);
      setChatResponses(prev => [...prev, { type: 'bot', text: "Error: Could not get a response. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (chatResponseRef.current) {
      chatResponseRef.current.scrollTop = chatResponseRef.current.scrollHeight;
    }
  }, [chatResponses]);

  return (
    <div className="chat-interface-container">
      <Header width='100%' />
      <Box className="welcome-message">
        <Typography variant="h6" className="welcome-text" gutterBottom>
          Can I help you with anything?
        </Typography>
        <Typography variant="body1" className="welcome-subtext">
          Ready to assist you with anything you need from GDrive Docs.
        </Typography>
      </Box>
      {chatResponses.length > 0 && (<Box className="chat-content">
        <Box ref={chatResponseRef} className="chat-messages">
          {chatResponses.map((message, index) => (
            <Box key={index} className={`message-container ${message.type === 'user' ? 'user' : 'bot'}`}>
              {message.type === 'user' ? (
                <PersonIcon className="message-icon" />
              ) : (
                <img src={aiIcon} alt="AI" className="message-icon" />
              )}
              <Typography className={`message-text ${message.type === 'user' ? 'user-message' : 'bot-response'}`}>
                {message.text}
              </Typography>
            </Box>
          ))}
          {isChatLoading && (
            <Box className="loading-indicator">
              <CircularProgress size={24} style={{ color: '#101010' }} />
            </Box>
          )}
        </Box>
      </Box>)}
      <Box component="form" onSubmit={handleChat} className="input-container">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask questions about your documents"
          value={chatQuery}
          onChange={handleQuestionChange}
          className="question-input"
          disabled={isChatLoading}
          InputProps={{
            endAdornment: (
              <IconButton type="submit" aria-label="submit question" edge="end" disabled={isChatLoading}>
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Box>
    </div>
  );
};

export default ChatInterface;