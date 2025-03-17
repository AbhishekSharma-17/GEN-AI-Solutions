import React, { useState, useEffect, useRef } from 'react';
import StreamingResponse from '../StreamingResponse/StreamingResponse';
import './StreamingPage.css';

const StreamingPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatContainerRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '' || isStreaming) return;

    const newUserMessage = { type: 'user', content: inputMessage };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: inputMessage }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        botResponse += chunk;
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          if (newMessages[newMessages.length - 1].type === 'bot') {
            newMessages[newMessages.length - 1].content = botResponse;
          } else {
            newMessages.push({ type: 'bot', content: botResponse });
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [...prevMessages, { type: 'bot', content: 'An error occurred while fetching the response.' }]);
    } finally {
      setIsStreaming(false);
      setInputMessage('');
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-page">
      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here"
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming}>Send</button>
      </form>
    </div>
  );
};

export default StreamingPage;
