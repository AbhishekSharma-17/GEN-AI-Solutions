import React, { useContext, useState, useRef } from "react";
import assets from "../../assets/assets";
import { Context } from "../../context/Context";
import UploadSection from "../UploadSection/UploadSection";
import Greeting from "../Greeting/Greeting";
import QueryCard from "../QueryCard/QueryCard";
import BottomSection from "../BottomSection/BottomSection";
import { FaUserCircle } from "react-icons/fa";
import ResponseLoader from "../Response Loader/ResponseLoader";

const Main = () => {
  const {
    input,
    setInput,
    setFileResponse,
    response,
    setResponse,
    recentPrompt,
    showResult,
    loadings,
    setLoadings,
    fileResponse,
    setShowResult,
    setRecentPrompt,
    setPreviousPrompt,
  } = useContext(Context);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [isEmbedComplete, setIsEmbedComplete] = useState(false);
  const [queries, setQueries] = useState([]); // State to store all queries and responses
  const [chatHistory, setChatHistory] = useState([]); // State to store chat history
  const fileInputRef = useRef();

  // Function to handle query card clicks
  const handleQueryClick = async (query) => {
    try {
      setShowResult(true);
      setLoadings(true);
      setRecentPrompt(query);

      // Add user query to chat history
      const loaderIndex = chatHistory.length; // Track loader index
      setChatHistory((prev) => [
        ...prev,
        { type: "user", text: query },
        { type: "bot", text: null, loading: true },
      ]);

      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }), // Send query as JSON payload
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response from the server.");
      }

      const data = await res.text();
      setResponse(data);

      // Replace loader with the actual response
      setChatHistory((prev) =>
        prev.map((chat, index) =>
          index === loaderIndex + 1
            ? { ...chat, text: data, loading: false }
            : chat
        )
      );
      setPreviousPrompt((prev) => [...prev, query]);
    } catch (error) {
      console.error("Error:", error);

      const errorMessage = "An error occurred. Please try again.";
      setResponse(errorMessage);

      // Replace loader with error message
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
    <div className="main">
      {/* Navigation Bar */}
      <div className="nav">
        <p className="main-nav-para-text">
          <a href="https://www.genaiprotos.com/">GenAI Protos</a>
        </p>
        <img src={assets.icon} alt="" />
      </div>

      {/* Main Container */}
      <div className="main-container">
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
              setQueries={setQueries} // Pass setQueries to handle query updates
            />
          </>
        ) : (
          <>
            {!showResult ? (
              <QueryCard queries={queries} handleQueryClick={handleQueryClick} />
            ) : (
              <div className="result">
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`chat-message ${chat.type} chat`}>
                    {chat.type === "user" ? (
                      <div className="result-title">
                        <FaUserCircle style={{ fontSize: "30px" }} className="result-title-user-icon" />
                        <p>{chat.text}</p>
                      </div>
                    ) : (
                      <div className="result-data">
                        <img src={assets.icon} alt="" />
                        {chat.loading ? (
                          <ResponseLoader />
                        ) : (
                          <p dangerouslySetInnerHTML={{ __html: chat.text }} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <BottomSection
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Main;
