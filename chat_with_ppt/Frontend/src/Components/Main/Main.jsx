import React, { useContext, useState, useRef } from "react";
import assets from "../../assets/assets";
import { FaFileUpload } from "react-icons/fa";
import { Context } from "../../context/Context";

const Main = () => {
  const {
    fileResponse,
    setFileResponse,
    recentPrompt,
    showResult,
    loadings,
    resultData,
    input,
    setInput,
    fileUploaded,
    setFileUploaded,
  } = useContext(Context);

  const [file, setFile] = useState(null); // State to hold the selected file
  const fileInputRef = useRef(); // Reference for the file input

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile); // Set the selected file
  };

  const handleFileUpload = async (event) => {
    event.preventDefault(); // Prevent default form submission

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Replace with your API endpoint
      const response = await fetch("YOUR_API_ENDPOINT", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed.");
      }

      const data = await response.json();
      // Handle the response data as needed
      console.log(data);
      // Optionally, you can update the context or state with the result
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="main">
      <div className="nav">
        <p>GenAI Protos</p>
        <img src={assets.icon}  alt="" />
      </div>
      <div className="main-container">
        {!showResult ? (
          <>
            <div className="greet">
              <span>Welcome To, GenAI Protos..</span>

              <p className="greetPara2">One Solutions for Innovative Idea's</p>
            </div>
            {/* Input field for uploading file */}
            <div className="file-upload">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.pdf,.docx" // Specify accepted file types
                ref={fileInputRef}
                hidden // Hide the input
              />
              {file ? ( // Check if a file is selected
                <>
                  <p className="file-name">{file.name}</p>{" "}
                  {/* Display the file name */}
                  <button onClick={handleFileUpload} className="btn btn-dark">
                    Upload File
                  </button>
                </>
              ) : (
                <FaFileUpload
                  onClick={() => fileInputRef.current.click()} // Open file dialog
                  style={{
                    cursor: "pointer",
                    fontSize: "5rem",
                    color: "grey",
                  }}
                />
              )}
            </div>
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

        <div className="main-bottom">
          {fileResponse ? (
            <form className="search-box">
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
          ) : null}
          <p className="bottom-info">
            GenAI Protos may display inaccurate information, such as the number
            of bytes and also including about the people.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;
