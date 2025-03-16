import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.header`
  background-color: var(--primary-color);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  
  h1 {
    font-size: 1.5rem;
    margin: 0;
    font-weight: 600;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Button = styled.button`
  background-color: ${props => props.transparent ? 'transparent' : 'white'};
  color: ${props => props.transparent ? 'white' : 'var(--primary-color)'};
  border: ${props => props.transparent ? '1px solid white' : 'none'};
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.transparent ? 'rgba(255, 255, 255, 0.1)' : '#f1f1f1'};
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`;

const Message = styled.div`
  background-color: ${props => props.isUser ? 'var(--primary-color)' : 'var(--secondary-color)'};
  color: ${props => props.isUser ? 'white' : 'var(--text-color)'};
  padding: 1rem;
  border-radius: 12px;
  border-bottom-right-radius: ${props => props.isUser ? '4px' : '12px'};
  border-bottom-left-radius: ${props => !props.isUser ? '4px' : '12px'};
  max-width: 80%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageTime = styled.div`
  font-size: 0.8rem;
  color: var(--light-text);
  margin-top: 0.5rem;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background-color: white;
  border-top: 1px solid var(--border-color);
  position: sticky;
  bottom: 0;
`;

const Form = styled.form`
  display: flex;
  width: 100%;
  gap: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  outline: none;
  
  &:focus {
    border-color: var(--primary-color);
  }
`;

const SendButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #0256b4;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const TimeframeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TimeframeOption = styled.button`
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-color)'};
  border: 1px solid ${props => props.active ? 'var(--primary-color)' : 'var(--border-color)'};
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#0256b4' : 'rgba(3, 102, 214, 0.1)'};
  }
`;

const WelcomeMessage = styled.div`
  text-align: center;
  margin: 2rem 0;
  color: var(--light-text);
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-color);
  }
  
  p {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
`;

// Icons
const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7-10-7" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const ChatPage = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeFrame, setTimeFrame] = useState(24);
  
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleClearHistory = async () => {
    try {
      await api.chat.clearHistory();
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = {
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await api.chat.sendQuery(input, timeFrame);
      
      const assistantMessage = {
        role: 'assistant',
        text: response.data.answer,
        timestamp: response.data.messages[response.data.messages.length - 1].timestamp
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending query:', error);
      const errorMessage = {
        role: 'assistant',
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };
  
  return (
    <Container>
      <Header>
        <Logo onClick={handleGoToDashboard}>
          <EnvelopeIcon />
          <h1>Gmail Agent</h1>
        </Logo>
        <HeaderActions>
          <Button transparent onClick={handleClearHistory}>
            Clear History
          </Button>
          <Button onClick={handleGoToDashboard}>
            Return to Dashboard
          </Button>
        </HeaderActions>
      </Header>
      
      <ChatContainer>
        <TimeframeSelector>
          <TimeframeOption 
            active={timeFrame === 24} 
            onClick={() => setTimeFrame(24)}
          >
            Last 24 Hours
          </TimeframeOption>
          <TimeframeOption 
            active={timeFrame === 72} 
            onClick={() => setTimeFrame(72)}
          >
            Last 3 Days
          </TimeframeOption>
          <TimeframeOption 
            active={timeFrame === 168} 
            onClick={() => setTimeFrame(168)}
          >
            Last 7 Days
          </TimeframeOption>
          <TimeframeOption 
            active={timeFrame === 336} 
            onClick={() => setTimeFrame(336)}
          >
            Last 14 Days
          </TimeframeOption>
        </TimeframeSelector>
        
        <MessagesList>
          {messages.length === 0 && (
            <WelcomeMessage>
              <h2>Welcome to Gmail Agent Chat!</h2>
              <p>Ask questions about your emails such as:</p>
              <p>"How many emails did I get from John this week?"</p>
              <p>"What are the main topics in my inbox?"</p>
              <p>"Do I have any emails about meeting next week?"</p>
              <p>"Summarize my important emails from yesterday"</p>
            </WelcomeMessage>
          )}
          
          {messages.map((message, index) => (
            <MessageWrapper key={index} isUser={message.role === 'user'}>
              <Message isUser={message.role === 'user'}>
                {message.text}
              </Message>
              <MessageTime>
                {formatTime(message.timestamp)}
              </MessageTime>
            </MessageWrapper>
          ))}
          
          {loading && (
            <MessageWrapper>
              <Message>
                <LoadingSpinner text="Thinking..." />
              </Message>
            </MessageWrapper>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesList>
        
        <InputContainer>
          <Form onSubmit={handleSendMessage}>
            <Input
              type="text"
              placeholder="Ask about your emails..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <SendButton type="submit" disabled={loading || !input.trim()}>
              <SendIcon />
            </SendButton>
          </Form>
        </InputContainer>
      </ChatContainer>
    </Container>
  );
};

export default ChatPage;
