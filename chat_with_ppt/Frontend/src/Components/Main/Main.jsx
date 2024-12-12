import React, { useContext, useState, useRef } from "react";
import assets from "../../assets/assets";
import { Context } from "../../context/Context";
import UploadSection from "../UploadSection/UploadSection";
import Greeting from "../Greeting/Greeting";
import ResultSection from "../ResultSection/ResultSection";
import BottomSection from "../BottomSection/BottomSection";

const Main = () => {
  const {
    recentPrompt,
    showResult,
    loadings,
    resultData,
    input,
    setInput,
    setFileResponse,
  } = useContext(Context);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [isEmbedComplete, setIsEmbedComplete] = useState(false); // New state
  const fileInputRef = useRef();

  return (
    <div className="main">
      <div className="nav">
        <p className="main-nav-para-text"><a href="https://www.genaiprotos.com/">GenAI Protos</a></p>
        <img src={assets.icon} alt="" />
      </div>
      <div className="main-container">
        {!showResult ? (
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
              setIsEmbedComplete={setIsEmbedComplete} // Pass prop
            />
          </>
        ) : (
          <ResultSection
            recentPrompt={recentPrompt}
            resultData={resultData}
            loadings={loadings}
          />
        )}
        {isEmbedComplete && <BottomSection input={input} setInput={setInput} />}
      </div>
    </div>
  );
};

export default Main;
