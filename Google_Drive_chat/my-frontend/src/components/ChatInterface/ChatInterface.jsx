/* eslint-disable no-loop-func */
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Typography, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { FaUserCircle } from "react-icons/fa";
import './ChatInterface.css'; 
import icon from '../../assets/icon.png';
import send_icon from '../../assets/send_icon.png';
import ResponseLoader from '../commonComponents/Response Loader/ResponseLoader';

const ChatInterface = () => {
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponses, setChatResponses] = useState([]);
  const [sources, setSources] = useState([]);
  const chatResponseRef = useRef(null);

  const handleQuestionChange = (event) => {
    setChatQuery(event.target.value);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    setChatResponses(prev => [...prev, { type: 'user', text: chatQuery }]);
    setChatQuery('');

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

      setChatResponses(prev => [...prev, { type: 'bot', text: '', isLoading: true }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;

        const sourcesDividerRegex = /#{2,6}\s*Sources\s*/i; // Matches ## Sources, ### Sources, etc.
        const sourcesMatch = responseText.match(sourcesDividerRegex);
        let mainText = responseText.trim();
        let sourcesText = '';

        if (sourcesMatch) {
          const sourcesIndex = sourcesMatch.index;
          mainText = responseText.substring(0, sourcesIndex).trim();
          sourcesText = responseText.substring(sourcesIndex + sourcesMatch[0].length).trim();
        }

        // Remove reference numbers (e.g., [1], [2]) from main text
        mainText = mainText.replace(/\[\d+\]/g, '').trim();

        // Update chatResponses with main text
        setChatResponses(prev => {
          const updatedResponses = [...prev];
          const lastResponse = updatedResponses[updatedResponses.length - 1];
          if (lastResponse && lastResponse.type === 'bot') {
            lastResponse.text = mainText;
            lastResponse.isLoading = false;
          }
          return updatedResponses;
        });

        // Process and update sources
        if (sourcesText) {
          const sourceLines = sourcesText
            .split('\n')
            .filter(line => line.trim() !== '' && line.match(/^\[\d+\]/)) // Ensure it matches source format
            .map(line => {
              // Extract name and URL from "[number] [name](URL) - [Google Drive]"
              const match = line.match(/^\[\d+\]\s*\[(.*?)\]\((.*?)\)\s*-\s*\[Google Drive\]/);
              if (match) {
                const [, name, url] = match;
                return { name, url };
              }
              return null; // Skip malformed lines
            })
            .filter(source => source !== null); // Remove null entries
          setSources(prev => {
            const newSources = sourceLines.filter(
              newSource => !prev.some(prevSource => prevSource.url === newSource.url)
            );
            return [...prev, ...newSources];
          });
        }

        if (chatResponseRef.current) {
          chatResponseRef.current.scrollTop = chatResponseRef.current.scrollHeight;
        }
      }
    } catch (err) {
      console.error("Error in chat request:", err);
      setChatResponses(prev => {
        const updatedResponses = [...prev];
        const lastResponse = updatedResponses[updatedResponses.length - 1];
        if (lastResponse && lastResponse.type === 'bot') {
          lastResponse.text = "Error: Could not get a response. Please try again.";
          lastResponse.isLoading = false;
        }
        return updatedResponses;
      });
    }
  };

  useEffect(() => {
    if (chatResponseRef.current) {
      chatResponseRef.current.scrollTop = chatResponseRef.current.scrollHeight;
    }
  }, [chatResponses]);

  return (
    <div className="chat-interface-container">
      <Box className="chat-main">
        {chatResponses.length === 0 && (
          <Box className="welcome-message">
            <Typography variant="h6" className="welcome-text" gutterBottom>
              Can I help you with anything?
            </Typography>
            <Typography variant="body1" className="welcome-subtext">
              Ready to assist you with anything you need from GDrive Docs.
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
                        <ResponseLoader />
                      ) : (
                        <div className="markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => (
                                <p {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <li style={{ marginBottom: "0.5em" }} {...props} />
                              ),
                              pre: ({ node, ...props }) => (
                                <pre
                                  style={{
                                    backgroundColor: "#f0f0f0",
                                    padding: "1em",
                                    borderRadius: "4px",
                                    overflowX: "auto",
                                  }}
                                  {...props}
                                />
                              ),
                              code: ({ node, inline, ...props }) =>
                                inline ? (
                                  <code
                                    style={{
                                      backgroundColor: "#e0e0e0",
                                      padding: "0.2em 0.4em",
                                      borderRadius: "3px",
                                    }}
                                    {...props}
                                  />
                                ) : (
                                  <code
                                    style={{
                                      display: "block",
                                      whiteSpace: "pre-wrap",
                                    }}
                                    {...props}
                                  />
                                ),
                            }}
                          >
                            {chat.text}
                          </ReactMarkdown>
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
            GenAI Protos may display inaccurate information, such as the number of
            bytes and also including about the people.
          </p>
        </div>
      </Box>
      {sources.length > 0 && (
        <Box className="sidebar">
          <Typography variant="h6" className="sidebar-title">Sources</Typography>
          <ul className="sources-list">
            {sources.map((source, index) => (
              <li key={index} className="source-item">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </Box>
      )}
    </div>
  );
};

export default ChatInterface;