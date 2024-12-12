import React, { useContext, useState, useRef } from "react";
import assets from "../../assets/assets";
import { FaFileUpload } from "react-icons/fa";
import { Context } from "../../context/Context";

const Main = () => {
  const {
    setFileResponse,
    recentPrompt,
    showResult,
    loadings,
    resultData,
    input,
    setInput,
  } = useContext(Context);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);
  const [embedding, setEmbedding] = useState(false); // Embedding state
  const [filePath, setFilePath] = useState("");
  const fileInputRef = useRef();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setEmbedReady(false);
    setFilePath("");
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed.");
      }

      const data = await response.json();
      console.log("Upload Response:", data);

      setFilePath(data.file_path);
      setEmbedReady(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEmbedDoc = async () => {
    if (!filePath) {
      alert("No file path found. Please upload a file first.");
      return;
    }

    try {
      setEmbedding(true);
      const response = await fetch("http://localhost:8000/embed", {
        method: "POST",
        body: JSON.stringify({ file_path: filePath }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Embedding document failed.");
      }
      const data = await response.json();
      console.log("Embed Response:", data.queries);

      if (setFileResponse) {
        setFileResponse(data);
      } else {
        console.error("setFileResponse is not defined in the Context.");
      }
    } catch (error) {
      console.error("Error embedding document:", error);
      alert("Embedding failed. Please try again.");
    } finally {
      setEmbedding(false);
    }
  };

  return (
    <div className="main">
      <div className="nav">
        <p>GenAI Protos</p>
        <img src={assets.icon} alt="" />
      </div>
      <div className="main-container">
        {!showResult ? (
          <>
            <div className="greet">
              <span>Welcome To, GenAI Protos..</span>
              <p className="greetPara2">One Solution for Innovative Ideas</p>
            </div>
            <div className="file-upload">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".ppt, .pptx"
                ref={fileInputRef}
                hidden
              />
              {uploading || embedding ? (
                <div className="loader">
                  <hr />
                  <hr />
                  <hr />
                </div>
              ) : file ? (
                !embedReady ? (
                  <button
                    onClick={handleFileUpload}
                    className="btn btn-dark"
                  >
                    Upload File
                  </button>
                ) : (
                  <button
                    onClick={handleEmbedDoc}
                    className="btn btn-success"
                  >
                    Embed Doc
                  </button>
                )
              ) : (
                <FaFileUpload
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    cursor: "pointer",
                    fontSize: "5rem",
                    color: "grey",
                  }}
                />
              )}
            </div>
            {embedReady && (
              <div className="embed-info">
                <p>File ready for embedding. Click "Embed Doc".</p>
              </div>
            )}
          </>
        ) : (
          <div className="result">
            <div className="result-title">
              <img src={assets.user_icon} alt="" />
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              <img src={assets.gemini_icon} alt="" />
              {loadings ? (
                <div className="loader">
                  <hr />
                  <hr />
                  <hr />
                </div>
              ) : (
                <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
              )}
            </div>
          </div>
        )}
        {embedReady && !embedding && (
          <div className="main-bottom">
            <form className="search-box" onSubmit={handleEmbedDoc}>
              <input
                type="text"
                placeholder="Ask GenAI Protos anything..."
                onChange={(event) => setInput(event.target.value)}
                value={input}
              />
              <div>
                <img src={assets.gallery_icon} alt="" />
                <img src={assets.mic_icon} alt="" />
                {input ? <img src={assets.send_icon} alt="" /> : null}
              </div>
            </form>
            <p className="bottom-info">
              GenAI Protos may display inaccurate information, such as the
              number of bytes and also including about the people.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Main;
