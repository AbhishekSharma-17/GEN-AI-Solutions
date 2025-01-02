import React, { useContext, useRef } from "react";
import "./FileUpload.css";
import { FaRegTrashAlt } from "react-icons/fa";
import { TbFileTypeSql } from "react-icons/tb";
import assets from "../../assets/assets";
import { Context } from "../../Context/Context";
import { MdOutlineFileUpload } from "react-icons/md";


const FileUpload = () => {
  const { selectedProvider, setSelectedProvider } = useContext(Context);

  const providerOptions = [
    { name: "OpenAI", value: "OpenAI", img: assets.chatGPTIcon },
    { name: "Gemini", value: "Gemini", img: assets.gemini_icon },
    { name: "Anthropic", value: "Anthropic", img: assets.anthropic },
    { name: "Hugging Face", value: "Hugging Face", img: assets.hugging_face },
  ];

  const SQLfileRef = useRef()
  return (
    <div className="file-upload container">
      <div className="file-upload-common">
        <p className="file-upload-title">
          Convert your SQL queries to PySpark code effortlessly. Simply provide
          your API credentials, select the LLM provider, and upload your SQL
          files.
        </p>
      </div>
      <form action="" className="file-upload-form">
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
                      //   onClick={() => setLLMType(provider.label)}
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
            // onChange={handleFileChange}
            accept=".sql"
            ref={SQLfileRef}
            hidden
            multiple
          />
          <MdOutlineFileUpload
              onClick={() => SQLfileRef.current.click()}
              style={{ cursor: "pointer", fontSize: "5rem", backgroundColor:"#e6e5e5", borderRadius:"50%", padding:"10px" , color:"grey"}}
            />
            <p className="file-icon-upload-text">
              Drag and drop your .sql files here - or click to select.
            </p>
        </div>
      </form>

      <div className="file-upload-common uploaded-files">
        <div className="upload-file-title">
          <p>Upload Files</p>
          <p id="number-of-files">Number of files : 4</p>
        </div>
        <div className="all-files">
          <div className="file">
            <div className="file-icon-name">
              <TbFileTypeSql style={{ fontSize: "30px", color: "orange" }} />

              <p className="uploaded-file-name">alter_query.sql</p>
            </div>
            <FaRegTrashAlt style={{ color: "red" }} />
          </div>
        </div>
      </div>

      <div className="file-upload-common convert-btn-div">
        <button type="submit" className="btn btn-dark convertbtn">
          Convert To PySpark
        </button>
        <button type="submit" className="btn btn-light cancelbtn">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
