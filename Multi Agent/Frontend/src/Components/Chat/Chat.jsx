import React, { useContext, useState, useEffect, useRef } from 'react';
import "./Chat.css";
import { IoSend, IoChatbubbleOutline, IoPersonOutline, IoChevronDownOutline, IoChevronUpOutline } from "react-icons/io5";
import { AdminContext } from "../../Context/AdminContext";

const STORAGE_KEY = 'adminChatMessages';

const Chat = () => {
  const { query, setQuery } = useContext(AdminContext);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);

  // Load messages from localStorage only once when component mounts
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages && savedMessages !== 'undefined' && savedMessages !== 'null') {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          // console.log('Loading saved messages:', parsedMessages.length);
          setMessages(parsedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // Skip on initial mount to avoid overriding with empty array
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    try {
      if (messages.length > 0) {
        // console.log('Saving messages to localStorage:', messages.length);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseResponse = (responseText) => {
    // Extract only what we need from the response
    const response = {
      agents: [],
      finalAnswer: null
    };

    // Extract Agent data with tools and steps
    const agentMatches = responseText.match(/Agent (.+?) Response: (.+?)(?=Agent|Synthesis|Final Answer:|$)/gs);
    
    if (agentMatches) {
      agentMatches.forEach(match => {
        const agentNameMatch = match.match(/Agent (.+?) Response:/);
        if (!agentNameMatch) return;
        
        const agentName = agentNameMatch[1];
        
        // Try to find thought from JSON format
        const thoughtMatch = match.match(/\[\s*\{\s*"thought"\s*:\s*"([^"]+)/);
        let thought = thoughtMatch ? thoughtMatch[1] : '';
        
        // Collect all tool usages for this agent
        const toolMatches = match.match(/Tool Used: (.+?)[\r\n]/g) || [];
        const toolOutputMatches = match.match(/Tool Output: (.+?)[\r\n]/g) || [];
        
        const steps = [];
        // Add agent actions
        const actionMatches = match.match(/Agent .+?: (.+?)(?=Tool Used:|$)/gs);
        if (actionMatches) {
          actionMatches.forEach(actionMatch => {
            const actionText = actionMatch.replace(/Agent .+?: /, '').trim();
            if (actionText && !actionText.includes('Response:')) {
              steps.push({
                type: 'action',
                content: actionText
              });
            }
          });
        }
        
        // Add tool usages as steps
        for (let i = 0; i < toolMatches.length; i++) {
          const tool = toolMatches[i].replace('Tool Used: ', '').trim();
          const output = i < toolOutputMatches.length ? 
            toolOutputMatches[i].replace('Tool Output: ', '').trim() : '';
            
          steps.push({
            type: 'tool',
            tool: tool,
            output: output
          });
        }
        
        response.agents.push({
          name: agentName,
          thought: thought,
          steps: steps
        });
      });
    }

    // Extract Final Answer
    const finalAnswerMatch = responseText.match(/Final Answer: (.+)$/s);
    if (finalAnswerMatch) {
      response.finalAnswer = finalAnswerMatch[1].trim();
    }

    return response;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const user_id = localStorage.getItem('AdminId');
    
    if (!user_id) {
      alert('User ID not found. Please log in again.');
      return;
    }

    if (!query.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create user message
      const userMessage = {
        id: Date.now().toString(),
        user_id: user_id,
        query: query,
        isUser: true
      };

      // Add user message to messages and immediately save to localStorage
      const updatedUserMessages = [...messages, userMessage];
      setMessages(updatedUserMessages);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserMessages));

      // Create a temporary message for streaming updates
      const tempBotMessageId = Date.now().toString() + '_temp_response';
      const updatedWithBotMessage = [...updatedUserMessages, { 
        id: tempBotMessageId, 
        user_id: 'bot', 
        isUser: false,
        streamingResponse: {
          text: '',
          isComplete: false
        }
      }];
      
      setMessages(updatedWithBotMessage);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWithBotMessage));

      // Make API call to get the streaming response
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id,
          query
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      // Handle the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      // Stream processing loop
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and add to our response
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        // Update the temporary message with the current streaming content
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const tempMessageIndex = updatedMessages.findIndex(msg => msg.id === tempBotMessageId);
          
          if (tempMessageIndex !== -1) {
            updatedMessages[tempMessageIndex] = {
              ...updatedMessages[tempMessageIndex],
              streamingResponse: {
                text: fullResponse,
                isComplete: false
              }
            };
          }
          
          // Save intermediate state to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
          return updatedMessages;
        });
      }

      // Parse the final response
      const parsedResponse = parseResponse(fullResponse);

      // Replace the temporary streaming message with final parsed response
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const tempMessageIndex = updatedMessages.findIndex(msg => msg.id === tempBotMessageId);
        
        if (tempMessageIndex !== -1) {
          updatedMessages[tempMessageIndex] = {
            id: Date.now().toString() + '_response',
            user_id: 'bot',
            response: parsedResponse,
            isUser: false
          };
        }
        
        // Save final state to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        return updatedMessages;
      });

      // Clear input
      setQuery('');
    } catch (error) {
      console.error('Error sending query:', error);
      
      // Show error message in chat
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const tempMessageIndex = updatedMessages.findIndex(msg => msg.id.includes('_temp_response'));
        
        if (tempMessageIndex !== -1) {
          updatedMessages[tempMessageIndex] = {
            id: Date.now().toString() + '_error',
            user_id: 'bot',
            error: `Failed to send message: ${error.message}. Please try again.`,
            isUser: false
          };
        }
        
        // Save error state to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear chat history
  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Component for agent card with collapsible details
  const AgentCard = ({ agent }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div className="agent-card">
        <div 
          className="agent-header"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h4>{agent.name}</h4>
          {isExpanded ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
        </div>
        
        {isExpanded && (
          <div className="agent-details">
            {agent.thought && (
              <div className="agent-thought">
                <h5>Thought</h5>
                <p>{agent.thought}</p>
              </div>
            )}
            
            {agent.steps.length > 0 && (
              <div className="agent-steps">
                {agent.steps.map((step, index) => (
                  <div key={index} className="agent-step">
                    {step.type === 'action' && (
                      <div className="step-action">
                        <p>{step.content}</p>
                      </div>
                    )}
                    
                    {step.type === 'tool' && (
                      <div className="step-tool">
                        <div className="tool-used">
                          <span>Tool Used:</span> {step.tool}
                        </div>
                        {step.output && (
                          <div className="tool-output">
                            <span>Tool Output:</span> {step.output}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFinalAnswer = (finalAnswer) => {
    return (
      <div className="final-answer-container">
        <h3>Final Answer</h3>
        <div className="final-answer-content">
          {finalAnswer}
        </div>
      </div>
    );
  };

  const renderStreamingResponse = (streamingText) => {
    try {
      // Attempt to extract any partial information
      const tempParsed = parseResponse(streamingText);
      
      return (
        <div className="streaming-response">
          {tempParsed.agents.length > 0 && (
            <div className="agents-container">
              <div className="agent-cards">
                {tempParsed.agents.map((agent, index) => (
                  <AgentCard 
                    key={index}
                    agent={agent}
                  />
                ))}
              </div>
            </div>
          )}
          
          {tempParsed.finalAnswer && renderFinalAnswer(tempParsed.finalAnswer)}
          
          {(!tempParsed.agents.length && !tempParsed.finalAnswer) && (
            <div className="processing-message">Processing...</div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error parsing streaming response:", error);
      return <div className="processing-message">Processing...</div>;
    }
  };

  const renderResponseDetails = (response) => {
    return (
      <div className="response-details">
        {response.agents.length > 0 && (
          <div className="agents-container">
            <div className="agent-cards">
              {response.agents.map((agent, index) => (
                <AgentCard 
                  key={index}
                  agent={agent}
                />
              ))}
            </div>
          </div>
        )}
        
        {response.finalAnswer && renderFinalAnswer(response.finalAnswer)}
      </div>
    );
  };

  const renderErrorMessage = (errorMessage) => {
    return (
      <div className="error-message">
        <p>{errorMessage}</p>
      </div>
    );
  };

  return (
    <div className="chat-section">
      <div className="messages-container">
        {/* {messages.length > 0 && (
          <div className="chat-controls">
            <button 
              onClick={clearChatHistory} 
              className="btn btn-sm btn-outline-danger"
            >
              Clear Chat History
            </button>
          </div>
        )} */}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-item ${msg.isUser ? 'user-message' : 'bot-message'}`}
          >
              <div className="message-icon">
                {msg.isUser ? <IoPersonOutline/> : <IoChatbubbleOutline />}
              </div>
            <div className="message-content" >
              <div className="message-text">
                {msg.query && <p className="query">{msg.query}</p>}
                {!msg.isUser && msg.response && renderResponseDetails(msg.response)}
                {!msg.isUser && msg.streamingResponse && renderStreamingResponse(msg.streamingResponse.text)}
                {!msg.isUser && msg.error && renderErrorMessage(msg.error)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-section">
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Ask your AI agents a question..."
            value={query}
            onChange={(event) => setQuery(event.target.value)} 
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className='btn btn-dark'
          >
            <IoSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;