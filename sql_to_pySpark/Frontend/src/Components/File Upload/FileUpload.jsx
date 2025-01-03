import React, { useContext, useRef } from "react";
import "./FileUpload.css";
import { FaRegTrashAlt } from "react-icons/fa";
import { TbFileTypeSql } from "react-icons/tb";
import assets from "../../assets/assets";
import { Context } from "../../Context/Context";
import { MdOutlineFileUpload } from "react-icons/md";

const FileUpload = () => {
  const {
    selectedProvider,
    setSelectedProvider,
    uploadedFiles,
    setUploadedFiles,
    providerChoice,
    setProviderChoice,
    apiKey,
    setApiKey,
    modelName,
    setModelName,
    conversionResults,
    setConversionResults,
    loading,
    setLoading,
  } = useContext(Context);

  const providerOptions = [
    { name: "OpenAI", value: "OpenAI", img: assets.chatGPTIcon },
    { name: "Gemini", value: "Gemini", img: assets.gemini_icon },
    { name: "Anthropic", value: "Anthropic", img: assets.anthropic },
    { name: "Hugging Face", value: "Hugging Face", img: assets.hugging_face },
  ];

  // Updated handleFileUpload
  const handleFileUpload = (event) => {
    const validFiles = Array.from(event.target.files).filter((file) =>
      file.name.endsWith(".sql")
    );
    if (validFiles.length === 0) {
      alert("Only .sql files are allowed!");
      return;
    }
    setUploadedFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  // Validation in handleConversion
  const handleConversion = (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!uploadedFiles.length) {
      alert("Please upload at least one SQL file.");
      return;
    }
    console.log("Uploaded files:", uploadedFiles);

    // Additional conversion logic...
  };

  const SQLfileRef = useRef();
  return (
    <div className="file-upload container">
      <div className="file-upload-common">
        <p className="file-upload-title text-bold">
          Convert your SQL queries to PySpark code effortlessly. Simply provide
          your API credentials, select the LLM provider, and upload your SQL
          files.
        </p>
      </div>
      <form
        action=""
        className="file-upload-form mt-3"
        onSubmit={(event) => {handleConversion(event)}}
      >
        <div className="file-upload-common api-llm-provider">
          <div className="mb-2 file-inputs">
            <label htmlFor="exampleSelect" className="form-label">
              API Key
            </label>
            <input type="password" className="form-control" name="" id="" />
          </div>
          <div className="mb-2 file-inputs">
            <label htmlFor="exampleSelect" className="form-label">
              Select Provider
            </label>
            <div className="dropdown">
              <button
                id="customDropdown"
                className="btn btn-transparent dropdown-toggle w-100 form-control"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                // ref={form_LLM_type}
              >
                {selectedProvider || "Select LLM Type"}
              </button>
              <ul
                className="dropdown-menu w-100"
                aria-labelledby="dropdownMenuButton"
              >
                {providerOptions.map((provider) => (
                  <li key={provider.value}>
                    <button
                      type="button" // Prevents form submission
                      className="dropdown-item d-flex align-items-center"
                      onClick={() => setSelectedProvider(provider.value)}
                    >
                      <img
                        src={provider.img}
                        alt={provider.name}
                        className="me-2"
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "10px",
                        }}
                      />
                      {provider.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="file-upload-common upload-section">
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".sql"
            ref={SQLfileRef}
            hidden
            multiple
          />
          <MdOutlineFileUpload
            onClick={() => SQLfileRef.current.click()}
            style={{
              cursor: "pointer",
              fontSize: "5rem",
              backgroundColor: "#e6e5e5",
              borderRadius: "50%",
              padding: "10px",
              color: "grey",
            }}
          />
          <p className="file-icon-upload-text">
            Drag and drop your .sql files here - or click to select.
          </p>
        </div>
      </form>

      <div className="file-upload-common uploaded-files">
        <div className="upload-file-title">
          <p>Upload Files</p>
          <p id="number-of-files">Number of files : {uploadedFiles.length}</p>
        </div>
        <div className="all-files">
          {uploadedFiles.map((file, index) => (
            <div className="file" key={index}>
              <div className="file-icon-name">
                <TbFileTypeSql style={{ fontSize: "30px", color: "orange" }} />

                <p className="uploaded-file-name">{file.name}</p>
              </div>
              <FaRegTrashAlt style={{ color: "red" }} />
            </div>
          ))}
        </div>
      </div>

      <div className="file-upload-common convert-btn-div">
        <button type="submit" className="btn btn-dark convertbtn" onClick={handleConversion}>
          Convert To PySpark
        </button>
        
      </div>
    </div>
  );
};

export default FileUpload;
