import React, { useState, useContext, useEffect, useRef } from "react";
import "./Chat.css";
import { BsFillSendFill } from "react-icons/bs";
import { Context } from "../../Context/Context";
import assets from "../../assets/assets";
import CustomDropdown from "./CustomDropdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ResponseLoader from "../Response Loader/ResponseLoader";

const Chat = () => {
  const {
    userId,
    selectedModel,
    setSelectedModel,
    setResponse,
    chatHistory,
    setChatHistory,
    setLoadings,
    responseProvider,
    initialQueries,
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
    setShowReview,
  } = useContext(Context);

  const inputField = useRef();
  const chatContainerRef = useRef(null);

  // Scroll to the bottom of the chat container whenever chatHistory changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const images = [
    assets.bulb_icon,
    assets.compass_icon,
    assets.history_icon,
    assets.message_icon,
  ];

  const options = [
    {
      value: "gpt-4o",
      label: "GPT-4o",
      img: assets.chatGPTIcon,
      provider: "openai",
    },
    {
      value: "gpt-4o-mini",
      label: "GPT-4o-Mini",
      img: assets.chatGPTIcon,
      provider: "openai",
    },
    {
      value: "gemini-1.5-flash",
      label: "Gemini-1.5-Flash",
      img: assets.gemini_icon,
      provider: "gemini",
    },
    {
      value: "gemini-2.0-flash-exp",
      label: "Gemini-2.0-Flash",
      img: assets.gemini_icon,
      provider: "gemini",
    },
  ];

  const handleHorizontalScroll = (event) => {
    const container = event.currentTarget;
    container.scrollLeft += event.deltaY;
    event.preventDefault();
  };

  useEffect(() => {
    if (!selectedModel) {
      if (responseProvider === "openai") {
        setSelectedModel(
          options.find((option) => option.value === "gpt-4o-mini")
        );
      } else if (responseProvider === "gemini") {
        setSelectedModel(
          options.find((option) => option.value === "gemini-1.5-flash")
        );
      }
    }
  }, [responseProvider, selectedModel, setSelectedModel, options]);

  const handleSend = async (event) => {
    event.preventDefault();
    const userInput = inputField.current.value;
    if (!userInput) return;

    setInput(userInput);
    setShowResult(true);
    setLoadings(true);
    setShowReview(true);

    const loaderIndex = chatHistory.length;
    setChatHistory((prev) => [
      ...prev,
      { type: "user", text: userInput },
      { type: "bot", text: "", loading: true },
    ]);

    try {
      const modelToUse =
        selectedModel ||
        (responseProvider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash");

      const res = await fetch(
        `http://localhost:8000/chat?user_id=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: userInput,
            provider: responseProvider,
            model: modelToUse.value,
            user_id: userId,
          }),
        }
      );
      inputField.current.value = "";
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
        setInputCost(parseFloat(metadata.input_cost).toFixed(4) || 0);
        setOutputCost(parseFloat(metadata.output_cost).toFixed(4) || 0);
        setTotalCost(parseFloat(metadata.total_cost).toFixed(4) || 0);
        setCumulativeTokens(parseInt(metadata.cumulative_tokens) || 0);
        setCumulativeCost(parseFloat(metadata.cumulative_cost).toFixed(3) || 0);
        setResponseTime(parseFloat(metadata.response_time).toFixed(2) || 0);
      }
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) =>
        prev.map((chat, index) =>
          index === loaderIndex + 1
            ? {
                ...chat,
                text: "An error occurred. Please try again.",
                loading: false,
              }
            : chat
        )
      );
    } finally {
      setLoadings(false);
    }
  };

  const handleQueryClickSend = async (event, QueryClickInput) => {
    event.preventDefault();
    if (!QueryClickInput) return;

    setShowResult(true);
    setLoadings(true);
    setShowReview(true);

    const loaderIndex = chatHistory.length;
    setChatHistory((prev) => [
      ...prev,
      { type: "user", text: QueryClickInput },
      { type: "bot", text: "", loading: true },
    ]);

    try {
      const modelToUse =
        selectedModel ||
        (responseProvider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash");

      const res = await fetch(
        `http://localhost:8000/chat?user_id=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: QueryClickInput,
            provider: responseProvider,
            model: modelToUse.value,
            user_id: userId,
          }),
        }
      );
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
        setInputCost(parseFloat(metadata.input_cost).toFixed(4) || 0);
        setOutputCost(parseFloat(metadata.output_cost).toFixed(4) || 0);
        setTotalCost(parseFloat(metadata.total_cost).toFixed(4) || 0);
        setCumulativeTokens(parseInt(metadata.cumulative_tokens) || 0);
        setCumulativeCost(parseFloat(metadata.cumulative_cost).toFixed(3) || 0);
        setResponseTime(parseFloat(metadata.response_time).toFixed(2) || 0);
      }
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) =>
        prev.map((chat, index) =>
          index === loaderIndex + 1
            ? {
                ...chat,
                text: "An error occurred. Please try again.",
                loading: false,
              }
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
      </div>

      <div className="main-chat">
        {chatHistory.length === 0 ? (
          <div className="main-chat-query">
            <div className="queries" onWheel={handleHorizontalScroll}>
              {initialQueries.map((query, index) => (
                <div
                  className="query"
                  key={index}
                  onClick={(event) => handleQueryClickSend(event, query)}
                >
                  <p>{query}</p>
                  <img src={images[index]} width="20" alt="query-icon" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-history" ref={chatContainerRef}>
            {chatHistory.map((chat, index) => (
              <div key={index} className={`chat-message ${chat.type}`}>
                {chat.loading ? (
                  <ResponseLoader />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {chat.text}
                  </ReactMarkdown>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-input">
        <div className="chat-inputs-section">
          <form className="chat-input-field" onSubmit={handleSend}>
            <input
              type="text"
              className="form-control"
              id="input-query"
              placeholder="Ask here !!"
              ref={inputField}
            />
            <button type="submit" className="btn btn-dark">
              <BsFillSendFill />
            </button>
          </form>
          <div className="custom-dropdown-division">
            <CustomDropdown
              options={options}
              selectedOption={selectedModel}
              setSelectedOption={setSelectedModel}
              provider={responseProvider}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
