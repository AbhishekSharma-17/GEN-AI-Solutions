import React, { useContext, useState, useEffect } from "react";
import assets from "../../assets/assets";
import { Context } from "../../context/Context";
import "./BottomSection.css";
import CustomDropdown from "./CustomDropdown";

const BottomSection = ({
  chatHistory,
  setChatHistory,
  selectedModel,
  setSelectedModel,
}) => {
  const {
    setResponse,
    setShowResult,
    setPreviousPrompt,
    input,
    setInput,
    setRecentPrompt,
    setLoadings,
    responseProvider,
    userId,
    setModelName,
    setInputToken,
    setOutputToken,
    setTotalToken,
    setInputCost,
    setOutputCost,
    setTotalCost,
    setCumulativeTokens,
    setCumulativeCost,
    setResponseTime,
    setEmbededToken,
    setEmbededCost,
  } = useContext(Context);

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

  useEffect(() => {
    // Set default model based on provider if no model is selected
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
    if (!input) return;
  
    try {
      setShowResult(true);
      setLoadings(true);
      setRecentPrompt(input);
      setEmbededCost("");
      setEmbededToken("");
      setInputToken("");
      setOutputToken("");
      setTotalToken("");
      setInputCost("");
      setOutputCost("");
      setTotalCost("");
      setCumulativeTokens("");
      setCumulativeCost("");
      setResponseTime("");
  
      const loaderIndex = chatHistory.length;
      setChatHistory((prev) => [
        ...prev,
        { type: "user", text: input },
        { type: "bot", text: "", loading: true },
      ]);
  
      setInput("");
  
      const modelToUse = selectedModel
        ? selectedModel.value
        : responseProvider === "openai"
        ? "gpt-4o-mini"
        : "gemini-1.5-flash";
      setModelName(modelToUse);
  
      const res = await fetch(
        `http://localhost:8000/chat?user_id=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: input,
            provider: responseProvider,
            model: modelToUse,
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
  
        // Update chat history with partial response
        const textOnly = accumulatedResponse.split("{")[0].trim(); // Extract main response text
        setChatHistory((prev) =>
          prev.map((chat, index) =>
            index === loaderIndex + 1
              ? { ...chat, text: textOnly, loading: false }
              : chat
          )
        );
      }
  
      // Extract metadata (JSON) after the main response text
      const metadataStart = accumulatedResponse.indexOf("{");
      const metadata = metadataStart !== -1 ? JSON.parse(accumulatedResponse.slice(metadataStart)) : {};
  
      // Set response text
      const textResponse = accumulatedResponse.split("{")[0].trim();
      setResponse(textResponse);
      setPreviousPrompt((prev) => [...prev, input]);
  
      // Update state with metadata
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
      const errorMessage = "An error occurred. Please try again.";
      setResponse(errorMessage);
      setChatHistory((prev) =>
        prev.map((chat, index) =>
          index === loaderIndex + 1
            ? { ...chat, text: errorMessage, loading: false }
            : chat
        )
      );
    } finally {
      setLoadings(false);
    }
  };
  

  return (
    <div className="main-bottom container">
      <form className="search-box" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask GenAI Protos anything..."
          onChange={(event) => setInput(event.target.value)}
          value={input}
        />
        <div className="dropdown-button-div">
          <div className="mic-model-option">
            <img src={assets.mic_icon} alt="Mic" className="img-fluid" />
            <CustomDropdown
              options={options}
              selectedOption={selectedModel}
              setSelectedOption={setSelectedModel}
              provider={responseProvider}
            />
          </div>
          {input ? (
            <button
              type="submit"
              style={{ border: "none", background: "none" }}
            >
              <img src={assets.send_icon} alt="Send" />
            </button>
          ) : null}
        </div>
      </form>
      <p className="bottom-info">
        GenAI Protos may display inaccurate information, such as the number of
        bytes and also including about the people.
      </p>
    </div>
  );
};

export default BottomSection;
