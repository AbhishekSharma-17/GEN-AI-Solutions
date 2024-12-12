import React, { useContext, useState, useRef, useEffect } from "react";
import assets from "../../assets/assets";
import { Context } from "../../context/Context";
import UploadSection from "../UploadSection/UploadSection";
import Greeting from "../Greeting/Greeting";
import QueryCard from "../QueryCard/QueryCard";
import BottomSection from "../BottomSection/BottomSection";
import { FaUserCircle } from "react-icons/fa";
import Loader from "../Loader/Loader";
import ResponseLoader from "../Response Loader/ResponseLoader";
import MultiModel from "../MultiModel/MultiModel";

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
    resultData,
    setResultData,
    fileResponse,
  } = useContext(Context);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [isEmbedComplete, setIsEmbedComplete] = useState(false);
  const [queries, setQueries] = useState([]); // State to store all queries and responses
  const [displayedResponse, setDisplayedResponse] = useState(""); // State to hold the displayed response
  const fileInputRef = useRef();

  // Function to type out the response character by character
  const typeResponse = (fullResponse) => {
    setDisplayedResponse(""); // Reset displayed response
    let index = 0;

    const interval = setInterval(() => {
      if (index < fullResponse.length) {
        setDisplayedResponse((prev) => prev + fullResponse[index]);
        index++;
      } else {
        clearInterval(interval); // Clear the interval when done
      }
    }, 50); // Adjust the delay (in milliseconds) as needed
  };

  // Effect to type out the response when it changes
  useEffect(() => {
    if (response) {
      typeResponse(response);
    }
  }, [response]);

  return (
    <div className="main">
      <div className="nav">
        <p className="main-nav-para-text">
          <a href="https://www.genaiprotos.com/">GenAI Protos</a>
        </p>
        <img src={assets.icon} alt="" />
      </div>
      {/* <MultiModel/> */}
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
                <div className="result-title">
                  <FaUserCircle style={{ fontSize: "30px" }} />
                  <p>{recentPrompt}</p>
                </div>
                <div className="result-data">
                  <img src={assets.icon} alt="" />
                  {loadings ? (
                  <ResponseLoader/>
                  ) : (
                    <p dangerouslySetInnerHTML={{ __html: displayedResponse }}></p> // Display the typed response
                  )}
                </div>
              </div>
            )}

            <BottomSection />
          </>
        )}
      </div>
    </div>
  );
};

export default Main;