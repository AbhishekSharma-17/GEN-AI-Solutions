import React, { useContext, useState, useEffect } from 'react';
import "./Chat.css";
import { IoSend, IoChatbubbleOutline, IoPersonOutline, IoInformationCircleOutline, IoSettingsOutline, IoCodeWorkingOutline } from "react-icons/io5";
import { AdminContext } from "../../Context/AdminContext";

const Chat = () => {
  const { query, setQuery } = useContext(AdminContext);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState(null);

  const parseResponse = (responseText) => {
    const response = {
      selectedAgents: [],
      toolUsed: null,
      toolOutput: [],
      agentResponses: [],
      synthesis: null,
      finalAnswer: null
    };

    // Extract Selected Agents
    const agentsMatch = responseText.match(/Selected agents: (.+)/);
    if (agentsMatch) {
      response.selectedAgents = agentsMatch[1].split(',').map(agent => agent.trim());
    }

    // Extract Tool Used
    const toolUsedMatch = responseText.match(/Tool Used: (.+)/);
    if (toolUsedMatch) {
      response.toolUsed = toolUsedMatch[1];
    }

    // Extract Tool Output
    const toolOutputMatch = responseText.match(/Tool Output: (.+)/);
    if (toolOutputMatch) {
      response.toolOutput = toolOutputMatch[1].split(',').map(output => output.trim());
    }

    // Extract Agent Responses
    const agentResponseMatches = responseText.match(/Agent (.+?) Response: (.+)/g);
    if (agentResponseMatches) {
      response.agentResponses = agentResponseMatches.map(match => {
        const [, agent, response] = match.match(/Agent (.+?) Response: (.+)/);
        return { agent, response };
      });
    }

    // Extract Synthesis
    const synthesisMatch = responseText.match(/Synthesis: (.+)/);
    if (synthesisMatch) {
      response.synthesis = synthesisMatch[1];
    }

    // Extract Final Answer
    const finalAnswerMatch = responseText.match(/Final Answer: (.+)/);
    if (finalAnswerMatch) {
      response.finalAnswer = finalAnswerMatch[1];
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
    setCurrentResponse(null);

    try {
      // Create user message
      const userMessage = {
        id: Date.now().toString(),
        user_id: user_id,
        query: query,
        isUser: true
      };

      // Add user message to messages
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Make API call
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
        throw new Error('Network response was not ok');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullResponse += chunk;
      }

      // Parse the response
      const parsedResponse = parseResponse(fullResponse);
      setCurrentResponse(parsedResponse);

      // Create bot message
      const botMessage = {
        id: Date.now().toString() + '_response',
        user_id: 'bot',
        response: parsedResponse,
        isUser: false
      };

      // Update messages with bot response
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Clear input
      setQuery('');
    } catch (error) {
      console.error('Error sending query:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderResponseDetails = (response) => {
    return (
      <div className="response-details">
        {response.selectedAgents.length > 0 && (
          <div className="response-section">
            <div className="section-header">
              <IoSettingsOutline />
              <h4>Selected Agents</h4>
            </div>
            <ul>
              {response.selectedAgents.map((agent, index) => (
                <li key={index}>{agent}</li>
              ))}
            </ul>
          </div>
        )}

        {response.toolUsed && (
          <div className="response-section">
            <div className="section-header">
              <IoCodeWorkingOutline />
              <h4>Tool Used</h4>
            </div>
            <p>{response.toolUsed}</p>
          </div>
        )}

        {response.toolOutput.length > 0 && (
          <div className="response-section">
            <div className="section-header">
              <IoInformationCircleOutline />
              <h4>Tool Output</h4>
            </div>
            <ul>
              {response.toolOutput.map((output, index) => (
                <li key={index}>{output}</li>
              ))}
            </ul>
          </div>
        )}

        {response.agentResponses.length > 0 && (
          <div className="response-section">
            <div className="section-header">
              <IoChatbubbleOutline />
              <h4>Agent Responses</h4>
            </div>
            {response.agentResponses.map((agentResponse, index) => (
              <div key={index} className="agent-response">
                <strong>{agentResponse.agent}:</strong>
                <p>{agentResponse.response}</p>
              </div>
            ))}
          </div>
        )}

        {response.synthesis && (
          <div className="response-section">
            <div className="section-header">
              <IoInformationCircleOutline />
              <h4>Synthesis</h4>
            </div>
            <p>{response.synthesis}</p>
          </div>
        )}

        {response.finalAnswer && (
          <div className="response-section final-answer">
            <div className="section-header">
              <IoInformationCircleOutline />
              <h4>Final Answer</h4>
            </div>
            <p>{response.finalAnswer}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-section">
      {/* <div className="chat-title">
        <p>Chat</p>
      </div> */}
      <div className="message">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-item ${msg.isUser ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              <div className="message-icon">
                {msg.isUser ? <IoPersonOutline /> : <IoChatbubbleOutline />}
              </div>
              <div className="message-text">
                {msg.query && <p className="query">{msg.query}</p>}
                {!msg.isUser && msg.response && renderResponseDetails(msg.response)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-item bot-message">
            <div className="message-content">
              <div className="message-icon">
                <IoChatbubbleOutline />
              </div>
              <div className="message-text">
                <p className="response">Processing...</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="input-section">
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Enter your message" 
            value={query}
            onChange={(event) => setQuery(event.target.value)} 
          />
          <button 
            type="submit" 
            disabled={isLoading}
          >
            <IoSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;