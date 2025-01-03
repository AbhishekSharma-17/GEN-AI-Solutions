import React, { useContext, useRef, useState } from "react";
import "./FileUpload.css";
import { FaRegTrashAlt } from "react-icons/fa";
import { TbFileTypeSql } from "react-icons/tb";
import assets from "../../assets/assets";
import { Context } from "../../Context/Context";
import { MdOutlineFileUpload } from "react-icons/md";
import { toast } from "react-toastify";

const FileUpload = () => {
  const {
    selectedProvider,
    setSelectedProvider,
    uploadedFiles,
    setUploadedFiles,
    apiKey,
    setApiKey,
    conversionResults,
    setConversionResults,
    loading,
    setLoading,
    modelOption,
    setModelOption,
    model,
    setModel,
  } = useContext(Context);

  const SQLfileRef = useRef();
  const form_api_key = useRef();
  const form_model_name = useRef();

  const providerOptions = [
    { name: "OpenAI", value: "OpenAI", img: assets.chatGPTIcon },
    { name: "Groq", value: "Groq", img: assets.groq },
    { name: "Anthropic", value: "Anthropic", img: assets.anthropic },
    { name: "Hugging Face", value: "Hugging Face", img: assets.hugging_face },
  ];

  // Update model options based on selected provider
  React.useEffect(() => {
    if (selectedProvider === "OpenAI") {
      setModelOption([
        { name: "gpt-4o", value: "gpt-4o", img: assets.chatGPTIcon },
        { name: "gpt-4o-mini", value: "gpt-4o-mini", img: assets.chatGPTIcon },
      ]);
    } else if (selectedProvider === "Anthropic") {
      setModelOption([
        {
          name: "claude-3-5-sonnet-20241022",
          value: "claude-3-5-sonnet-20241022",
          img: assets.anthropic,
        },
        {
          name: " claude-3-5-haiku-20241022",
          value: " claude-3-5-haiku-20241022",
          img: assets.anthropic,
        },
      ]);
    } else {
      setModelOption([]);
    }
  }, [selectedProvider]);

  // Handle file uploads
  const handleFileUpload = (event) => {
    const validFiles = Array.from(event.target.files).filter((file) =>
      file.name.endsWith(".sql")
    );

    const uniqueFiles = validFiles.filter(
      (file) => !uploadedFiles.some((uploaded) => uploaded.name === file.name)
    );

    if (uniqueFiles.length === 0) {
      toast.error("No new valid .sql files to upload!");
      return;
    }

    setUploadedFiles((prevFiles) => [...prevFiles, ...uniqueFiles]);
    toast.success(`${uniqueFiles.length} file(s) uploaded successfully!`);
  };

  // Handle conversion
  const handleConversion = async (e) => {
    e.preventDefault();
    if (!uploadedFiles.length) {
      toast.error("Please upload at least one SQL file.");
      return;
    }

    if (!form_api_key.current.value) {
      toast.error("API Key is required.");
      return;
    }

    if (!selectedProvider) {
      toast.error("Provider is required.");
      return;
    }

    if (!model) {
      toast.error("Model is required.");
      return;
    }

    toast.success("Conversion started!");
    setLoading(true);

    const apiKey = form_api_key.current.value;
    setApiKey(apiKey);

    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("llm_type", selectedProvider);
    formData.append("api_key", apiKey);
    formData.append("model", model);

    try {
      const response = await fetch("http://localhost:8000/convert", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setConversionResults(data);
      console.log(data);
    } catch (error) {
      console.error("Error during conversion", error);
      toast.error("An error occurred while converting the files");
    }

    setLoading(false);
    form_api_key.current.value = "";
    setSelectedProvider("Select LLM Type");
    setModel("Select Model");
  };

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
        onSubmit={handleConversion}
      >
        <div className="file-upload-common api-llm-provider">
          <div className="mb-2 file-inputs">
            <label htmlFor="exampleSelect" className="form-label">
              API Key
            </label>
            <input
              type="password"
              className="form-control"
              ref={form_api_key}
            />
          </div>
          <div className="mb-2 file-inputs">
            <label htmlFor="exampleSelect" className="form-label">
              Select Provider
            </label>
            <div className="dropdown">
              <button
                id="customDropdown1"
                className="btn btn-transparent dropdown-toggle w-100 form-control"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
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
                      type="button"
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
          {selectedProvider === "OpenAI" ||
          selectedProvider === "Anthropic" ||
          selectedProvider === "Groq" ||
          selectedProvider === "Hugging Face" ? (
            <div className="mb-2 file-inputs">
              <label htmlFor="exampleSelect" className="form-label">
                Select Model
              </label>
              <div className="dropdown">
                <button
                  id="customDropdown2"
                  className="btn btn-transparent dropdown-toggle w-100 form-control"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {model || "Select Model"}
                </button>
                <ul
                  className="dropdown-menu w-100"
                  aria-labelledby="dropdownMenuButton"
                >
                  {modelOption.map((modelOption, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center"
                        onClick={() => setModel(modelOption.value)}
                      >
                        <img
                          src={modelOption.img}
                          alt={modelOption.name}
                          className="me-2"
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "10px",
                          }}
                        />
                        {modelOption.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
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

      {uploadedFiles.length > 0 ? (
        <div className="file-upload-common uploaded-files">
          <div className="upload-file-title">
            <p>Upload Files</p>
            <p id="number-of-files">Number of files : {uploadedFiles.length}</p>
          </div>
          {loading ? null : (
            <div className="all-files">
              {uploadedFiles.map((file, index) => (
                <div className="file" key={index}>
                  <div className="file-icon-name">
                    <TbFileTypeSql
                      style={{ fontSize: "30px", color: "orange" }}
                    />
                    <p className="uploaded-file-name">{file.name}</p>
                  </div>
                  <FaRegTrashAlt
                    style={{ color: "red", cursor: "pointer" }}
                    onClick={() => {
                      setUploadedFiles((prevFiles) =>
                        prevFiles.filter((_, i) => i !== index)
                      );
                      toast.error(`${file.name} deleted successfully`);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="file-upload-common convert-btn-div">
        <button
          type="submit"
          className="btn btn-dark convertbtn"
          onClick={handleConversion}
        >
          Convert To PySpark
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
