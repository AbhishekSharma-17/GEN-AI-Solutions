/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-loop-func */
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Typography, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useDispatch, useSelector } from 'react-redux';
import { setChat } from '../../store/chatSlice';  // Adjust path as needed
import './ChatInterface.css'; 
import icon from '../../assets/icon.png';
import slackIcon from '../../assets/slack.png';
import send_icon from '../../assets/send_icon.png';
import ThreeDotsLoader from '../commonComponents/ThreeDotsLoader/ThreeDotsLoader';

const ChatInterface = () => {
  const [chatQuery, setChatQuery] = useState('');
  const chatResponseRef = useRef(null);
  const dispatch = useDispatch();
  const chatResponses = useSelector(state => state.chat.messages || []); // Fallback to empty array

  const handleQuestionChange = (event) => {
    setChatQuery(event.target.value);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    // Add user message
    const updatedResponses = [...chatResponses, { type: 'user', text: chatQuery }];
    dispatch(setChat(updatedResponses));
    setChatQuery('');

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: chatQuery,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      // Add initial bot response
      const withBotResponse = [...updatedResponses, { type: 'bot', text: '', isLoading: true, isToolsCollapsed: true }];
      dispatch(setChat(withBotResponse));

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;

        let mainText = responseText.trim();
        mainText = mainText.replace(/\[\d+\]/g, '').trim();

        // Update the last bot response
        const updatedWithText = withBotResponse.map((msg, idx) => 
          idx === withBotResponse.length - 1 && msg.type === 'bot'
            ? { ...msg, text: mainText, isLoading: false }
            : msg
        );
        dispatch(setChat(updatedWithText));

        if (chatResponseRef.current) {
          chatResponseRef.current.scrollTop = chatResponseRef.current.scrollHeight;
        }
      }
    } catch (err) {
      console.error("Error in chat request:", err);
      const errorResponse = withBotResponse.map((msg, idx) => 
        idx === withBotResponse.length - 1 && msg.type === 'bot'
          ? { ...msg, text: "Error: Could not get a response. Please try again.", isLoading: false }
          : msg
      );
      dispatch(setChat(errorResponse));
    }
  };

  useEffect(() => {
    if (chatResponseRef.current) {
      chatResponseRef.current.scrollTop = chatResponseRef.current.scrollHeight;
    }
  }, [chatResponses]);

  const toggleToolsCollapse = (index) => {
    const updatedResponses = chatResponses.map((msg, idx) => 
      idx === index && msg.type === 'bot'
        ? { ...msg, isToolsCollapsed: !msg.isToolsCollapsed }
        : msg
    );
    dispatch(setChat(updatedResponses));
  };

  const formatResponseText = (text, index) => {
    const lines = text.split('\n').filter(line => line.trim());
    const formattedItems = [];
    let finalMessage = '';
    const isCollapsed = chatResponses[index]?.isToolsCollapsed ?? true;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Tool Used : ') && i + 1 < lines.length && lines[i + 1].startsWith('Agent Action: ')) {
        const tool = lines[i].replace('Tool Used : ', '');
        const action = lines[i + 1].replace('Agent Action: ', '');
        formattedItems.push(
          <div key={`pair-${i}`} className="tool-info">
            <span className="tool-used">Tool:</span> {tool}
            <span className="agent-action">Action:</span> {action}
          </div>
        );
        i++;
      } else if (lines[i].startsWith('Tool Used : ')) {
        formattedItems.push(
          <div key={`tool-${i}`} className="tool-info">
            <span className="tool-used">Tool:</span> {lines[i].replace('Tool Used : ', '')}
          </div>
        );
      } else if (lines[i].startsWith('Agent Action: ')) {
        formattedItems.push(
          <div key={`action-${i}`} className="tool-info">
            <span className="agent-action">Action:</span> {lines[i].replace('Agent Action: ', '')}
          </div>
        );
      } else if (lines[i].trim()) {
        finalMessage += lines[i] + '\n';
      }
    }

    return (
      <div>
        {formattedItems.length > 0 && (
          <div className="tools-section">
            <div 
              className="tools-header" 
              onClick={() => toggleToolsCollapse(index)}
            >
              <Typography variant="subtitle1">
                Tools & Actions
              </Typography>
              {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </div>
            {!isCollapsed && (
              <div className="tools-container">
                {formattedItems}
              </div>
            )}
          </div>
        )}
        {finalMessage && (
          <div className="final-message">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {finalMessage.trim()}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  // Debugging log to check state
  console.log('chatResponses:', chatResponses);

  return (
    <div className="chat-interface-container">
      <Box className="chat-main">
        {chatResponses.length === 0 && (
          <Box className="welcome-message">
            <img 
              src={slackIcon} 
              alt="Slack Icon"
              style={{ 
                width: '64px', 
                height: '64px', 
                marginBottom: '20px' 
              }} 
            />
            <Typography variant="h6" className="welcome-text" gutterBottom>
              Can I help you with anything?
            </Typography>
            <Typography variant="body1" className="welcome-subtext">
              Ready to assist you with anything you need from Slack.
            </Typography>
          </Box>
        )}
        {chatResponses.length > 0 && (
          <Box className="chat-content">
            <div className="result" ref={chatResponseRef} style={{ overflowY: "auto" }}>
              {chatResponses.map((chat, index) => (
                <div key={index} className={`chat-message ${chat.type}`}>
                  {chat.type === "user" ? (
                    <div className="result-title">
                      <PersonIcon
                        style={{ fontSize: "40px" }}
                        className="result-title-user-icon"
                      />
                      <p>{chat.text}</p>
                    </div>
                  ) : (
                    <div className="result-data">
                      <img src={icon} alt="Bot Icon" />
                      {chat.isLoading ? (
                        <ThreeDotsLoader dotCount={5} />
                      ) : (
                        <div className="markdown-content">
                          {formatResponseText(chat.text, index)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Box>
        )}
        <div className="main-bottom chat-container">
          <form className="search-box" onSubmit={handleChat}>
            <input
              type="text"
              placeholder="Ask GenAI Protos anything..."
              onChange={handleQuestionChange}
              value={chatQuery}
            />
            <div className="dropdown-button-div">
              <button
                type="submit"
                style={{ border: "none", background: "none" }}
              >
                <img src={send_icon} alt="Send" />
              </button>
            </div>
          </form>
          <p className="bottom-info">
            We Build a Working Prototype for Your Gen AI Use Case in 8 Days.
          </p>
        </div>
      </Box>
    </div>
  );
};

export default ChatInterface;