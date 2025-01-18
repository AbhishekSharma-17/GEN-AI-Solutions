import React, { useContext, useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import UploadSection from "../UploadSection/UploadSection";
import Greeting from "../Greeting/Greeting";
import QueryCard from "../QueryCard/QueryCard";
import BottomSection from "../BottomSection/BottomSection";
import { FaUserCircle } from "react-icons/fa";
import ResponseLoader from "../Response Loader/ResponseLoader";
import "./Main.css";
import { Context } from "../../Context/Context";
import { assets } from "../../assets/assets";
import { TiArrowLeft } from "react-icons/ti";

const Main = () => {
  const {
    setFileResponse,
    showResult,
    setShowResult,
    setRecentPrompt,
    setPreviousPrompt,
    setLoadings,
    userId,
    responseProvider,
    setResponse,
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
    setModelName,
    isCardClicked,
    setIsCardClicked,
  } = useContext(Context);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [isEmbedComplete, setIsEmbedComplete] = useState(false);
  const [queries, setQueries] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const fileInputRef = useRef();
  const resultRef = useRef(); // Create a reference for the result div

  // Function to handle query card clicks
  const handleQueryClick = async (query) => {
    try {
      setShowResult(true);
      setLoadings(true);
      setRecentPrompt(query);
      setEmbededToken("");
      setEmbededCost("");
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
        { type: "user", text: query },
        { type: "bot", text: "", loading: true },
      ]);

      const modelToUse = selectedModel
        ? selectedModel.value
        : responseProvider === "openai"
        ? "gpt-4o-mini"
        : "gemini-1.5-flash";
      setModelName(modelToUse);

      const res = await fetch(`http://localhost:8000/chat?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          provider: responseProvider,
          model: modelToUse,
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
      const metadata =
        metadataStart !== -1
          ? JSON.parse(accumulatedResponse.slice(metadataStart))
          : {};

      // Set response text
      const textResponse = accumulatedResponse.split("{")[0].trim();
      setResponse(textResponse);
      setPreviousPrompt((prev) => [...prev, query]);
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

  // Scroll to the bottom of the result div whenever chatHistory changes
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="main">
      {/* Navigation Bar */}
      <div className="nav">
        <div className="back-div" onClick={() => setIsCardClicked(!isCardClicked)}>
          <TiArrowLeft style={{fontSize:"20px"}} className="back-icon"/>
        </div>
        <a href="https://www.genaiprotos.com/">
          <img src={assets.genAILogo} alt="" />
        </a>
      </div>

      {/* Main Container */}
      <div className="main-container container">
        {!isEmbedComplete ? (
          <>
            <Greeting />
            <UploadSection
              file={file}
              setFile={setFile}
              uploading={uploading}
              setUploading={setUploading}
              embedReady={embedReady}
              setEmbedReady={setEmbedReady}
              embedding={embedding}
              setEmbedding={setEmbedding}
              filePath={filePath}
              setFilePath={setFilePath}
              fileInputRef={fileInputRef}
              setFileResponse={setFileResponse}
              setIsEmbedComplete={setIsEmbedComplete}
              setQueries={setQueries}
            />
          </>
        ) : (
          <>
            {!showResult ? (
              <QueryCard
                queries={queries}
                handleQueryClick={handleQueryClick}
              />
            ) : (
              <div
                className="result"
                ref={resultRef}
                style={{ overflowY: "auto" }}
              >
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`chat-message ${chat.type} chat`}>
                    {chat.type === "user" ? (
                      <div className="result-title">
                        <FaUserCircle
                          style={{ fontSize: "30px" }}
                          className="result-title-user-icon"
                        />
                        <p>{chat.text}</p>
                      </div>
                    ) : (
                      <div className="result-data">
                        <img src={assets.icon} alt="" />
                        {chat.loading ? (
                          <ResponseLoader />
                        ) : (
                          <div className="markdown-content">
                            <ReactMarkdown
                              className="actual-markdown-content"
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ node, ...props }) => (
                                  <p
                                    style={{ marginBottom: "1em" }}
                                    {...props}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li
                                    style={{ marginBottom: "0.5em" }}
                                    {...props}
                                  />
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
            )}
          </>
        )}
      </div>

      {isEmbedComplete ? (
        <div className="bottom-section-div">
          <BottomSection
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </div>
      ) : null}
    </div>
  );
};

export default Main;
