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
              <QueryCard queries={queries} />
            ) : (
              <div className="result">
                {chatHistory.map((chat, index) => (
                  <div key={index} className={`chat-message ${chat.type} chat`}>
                    {chat.type === "user" ? (
                      <div className="result-title">
                        <FaUserCircle style={{ fontSize: "30px" }} className="result-title-user-icon"/>
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
            <BottomSection chatHistory={chatHistory} setChatHistory={setChatHistory} />
          </>
        )}
      </div>
    </div>
  );
};

export default Main;
