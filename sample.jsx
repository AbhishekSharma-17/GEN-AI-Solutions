import React, { useState, useContext } from "react";
import "./Chat.css";
import { BsFillSendFill } from "react-icons/bs";
import { Context } from "../../Context/Context";
import assets from "../../assets/assets";

const Chat = () => {
  
 


  const images = [
    assets.bulb_icon,
    assets.compass_icon,
    assets.history_icon,
    assets.message_icon,
  ];

  const {
    response, setResponse,
    input, setInput,
chatHistory, setChatHistory,
loadings, setLoadings,

    initialQueries,
    showResult,
    setShowResult,
    setInputToken,
    setOutputToken,
    setTotalToken,
    setInputCost,
    setOutputCost,
    setTotalCost,
    setCumulativeTokens,
    setCumulativeCost,
    setResponseTime,
    userId, // Assuming userId is in context
  } = useContext(Context);

  const handleHorizontalScroll = (event) => {
    const container = event.currentTarget;
    container.scrollLeft += event.deltaY; // Scroll horizontally based on vertical wheel movement
    event.preventDefault();
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!input) return;

    try {
      setShowResult(true);
      setLoading(true);

      const loaderIndex = chatHistory.length;
      setChatHistory((prev) => [
        ...prev,
        { type: "user", text: input },
        { type: "bot", text: "", loading: true },
      ]);

      const responseProvider = "openai"; // Set your provider dynamically if needed
      const modelToUse = selectedModel || (responseProvider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash");

      const res = await fetch(http://localhost:8000/chat?user_id=${userId}, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          provider: responseProvider,
          model: modelToUse,
          user_id: userId, // Use userId from context
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response from the server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;

        const textOnly = accumulatedResponse.split("{")[0].trim();
        setChatHistory((prev) =>
          prev.map((chat, index) =>
            index === loaderIndex + 1
              ? { ...chat, text: textOnly, loading: false }
              : chat
          )
        );
      }

      const metadataStart = accumulatedResponse.indexOf("{");
      const metadata =
        metadataStart !== -1
          ? JSON.parse(accumulatedResponse.slice(metadataStart))
          : {};

      setResponse(accumulatedResponse.split("{")[0].trim());

      if (metadata) {
        setInputToken(parseInt(metadata.input_tokens) || 0);
        setOutputToken(parseInt(metadata.output_tokens) || 0);
        setTotalToken(parseInt(metadata.total_tokens) || 0);
        setInputCost(parseFloat(metadata.input_cost).toFixed(5) || 0);
        setOutputCost(parseFloat(metadata.output_cost).toFixed(5) || 0);
        setTotalCost(parseFloat(metadata.total_cost).toFixed(5) || 0);
        setCumulativeTokens(parseInt(metadata.cumulative_tokens) || 0);
        setCumulativeCost(parseFloat(metadata.cumulative_cost).toFixed(3) || 0);
        setResponseTime(parseFloat(metadata.response_time).toFixed(2) || 0);
      }
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) =>
        prev.map((chat, index) =>
          index === loaderIndex + 1
            ? { ...chat, text: "An error occurred. Please try again.", loading: false }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-section-title">
        <p>Chat</p>
        <div>
        <label>Select Model:</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
        </select>
        </div>
      </div>
      <div className="main-chat">
        {!showResult && (
          <div className="main-chat-query">
            <div className="queries" onWheel={handleHorizontalScroll}>
              {initialQueries.map((query, index) => (
                <div className="query" key={index}>
                  <p>{query}</p>
                  <img src={images[index]} width="20" alt="" />
                </div>
              ))}
            </div>
          </div>
        )}


        <div className="chat-history">
          {chatHistory.map((chat, index) => (
            <div key={index} className={chat-message ${chat.type}}>
              {chat.loading ? <p>Loading...</p> : <p>{chat.text}</p>}
            </div>
          ))}
        </div>
      </div>

      <form className="chat-inputs" onSubmit={handleSend}>
        <div className="chat-input-field">
          <input
            type="text"
            className="form-control"
            id="input-query"
            placeholder="Ask here !!"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-dark">
          <BsFillSendFill />
        </button>
      </form>

      
    </div>
  );
};

export default Chat;