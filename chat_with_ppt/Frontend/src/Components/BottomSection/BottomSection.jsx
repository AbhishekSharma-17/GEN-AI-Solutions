import React, { useContext, useState, useEffect } from "react";
import assets from "../../assets/assets";
import { Context } from "../../context/Context";
import "./BottomSection.css";
import CustomDropdown from "./CustomDropdown";

const BottomSection = ({ chatHistory, setChatHistory }) => {
  const {
    setResponse,
    setShowResult,
    setPreviousPrompt,
    input,
    setInput,
    setRecentPrompt,
    setLoadings,
    responseProvider,
  } = useContext(Context);

  const [selectedModel, setSelectedModel] = useState(null);

  const options = [
    { value: "gpt-4o", label: "GPT-4o", img: assets.chatGPTIcon, provider: "openai" },
    { value: "gpt-4o-mini", label: "GPT-4o-Mini", img: assets.chatGPTIcon, provider: "openai" },
    { value: "gemini-1.5-flash", label: "Gemini-1.5-Flash", img: assets.gemini_icon, provider: "gemini" },
    { value: "gemini-2.0-flash-exp", label: "Gemini-2.0-Flash", img: assets.gemini_icon, provider: "gemini" },
  ];

  useEffect(() => {
    // Set default model based on provider
    if (responseProvider === 'openai') {
      setSelectedModel(options.find(option => option.value === 'gpt-4o-mini'));
    } else if (responseProvider === 'gemini') {
      setSelectedModel(options.find(option => option.value === 'gemini-1.5-flash'));
    }
  }, [responseProvider]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!input) return;

    try {
      setShowResult(true);
      setLoadings(true);
      setRecentPrompt(input);

      const loaderIndex = chatHistory.length;
      setChatHistory((prev) => [
        ...prev,
        { type: "user", text: input },
        { type: "bot", text: "", loading: true },
      ]);

      setInput("");


      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          provider: responseProvider,
          model: selectedModel ? selectedModel.value : (responseProvider === 'openai' ? '4o-mini' : '1.5 flash'),
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

        setChatHistory((prev) =>
          prev.map((chat, index) =>
            index === loaderIndex + 1
              ? { ...chat, text: accumulatedResponse, loading: false }
              : chat
          )
        );
      }

      setResponse(accumulatedResponse);
      setPreviousPrompt((prev) => [...prev, input]);
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
    <div className="main-bottom">
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
